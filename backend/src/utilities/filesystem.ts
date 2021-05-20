import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import archiver from 'archiver';
import ffmpeg from 'fluent-ffmpeg';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const saveDemographics = async (
    age: string,
    gender: string,
    id: string
) => {
    return new Promise<void>((resolve, reject) => {
        const obj = JSON.stringify({
            age,
            gender,
            sessionId: id.replace(/_client_[a|b]/, ''),
        });
        fs.writeFile(`../uploads/${id}.json`, obj, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

export interface ClientMetadata {
    age: string;
    duration_seconds: number;
    gender: string;
    sample_rate: number;
    session_id: string;
    reference: string;
}

export interface SessionMetadata {
    session_id: string;
    client_a?: ClientMetadata;
    client_b?: ClientMetadata;
}

const folderPath = '../uploads/';
export const getLocalSessions = (
    showPartial: boolean
): Array<SessionMetadata> => {
    const clientSessions: { [key: string]: SessionMetadata } = {};

    // Get all the json files in the folder
    const jsonList = fs
        .readdirSync(folderPath)
        .map((fileName) => {
            return path.join(folderPath, fileName);
        })
        .filter((value) => value.endsWith('.json'));

    jsonList.forEach((filename) => {
        // synchronously reads json contents
        const data = JSON.parse(
            fs.readFileSync(filename, 'utf8')
        ) as ClientMetadata;
        const clientType = filename.includes('client_a')
            ? 'client_a'
            : 'client_b';
        clientSessions[data.session_id] = clientSessions[data.session_id] || {};
        clientSessions[data.session_id].session_id = data.session_id;
        clientSessions[data.session_id][clientType] = data;
    });

    if (!showPartial) {
        return Object.values(clientSessions).filter(
            (session) =>
                session.client_a !== undefined &&
                session.client_b !== undefined &&
                session.client_a.duration_seconds &&
                session.client_b.duration_seconds
        );
    } else {
        return Object.values(clientSessions);
    }
};

export const downloadLocalSession = async (
    req: Request,
    res: Response
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any> => {
    const {
        params: { id },
    } = req;

    // Get all the associated files
    const Contents = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id))
        .filter((value) => value.endsWith('.json') || value.endsWith('.wav'));

    if (Contents === undefined || Contents.length == 0) {
        return res.status(500).send('Invalid_id');
    }
    const archive = archiver('zip', {
        zlib: { level: 6 }, // Sets the compression level.
    });

    // Log warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code !== 'ENOENT') {
            console.log('archive creation warnings: ' + err);
        }
    });

    // Catch error explicitly
    archive.on('error', function (err) {
        console.log('archive creation errors: ' + err);
    });

    // TODO: return res.status(500).send(error);
    archive.pipe(res);

    // Append contents, each metadata and audio file from stream
    Contents.forEach(function (fileName) {
        archive.append(fs.createReadStream(folderPath + fileName), {
            name: fileName,
        });
    });

    // finalize the archive (ie we are done appending files but streams have to
    // finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method
    // so register to them beforehand
    archive.finalize();
};

export const checkForMissingChunks = async (
    id: string,
    nbrOfChunks: number
): Promise<number[]> => {
    // get all existing chunks for this client and id
    const Contents = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id))
        .filter((value) => value.endsWith('.wav'));

    if (Contents.length === nbrOfChunks) {
        return [];
    }

    // Generate empty array of nbrOfChunks length
    const chunks: number[] = new Array<number>(nbrOfChunks).fill(0);

    // Mark all found values with one
    Contents.forEach((content) => {
        const numberString = content.split(`${id}_`).pop()?.split('.wav')[0]; // remove id and file ending from string
        const chunk: number = parseInt(numberString as string);
        console.log(`chunk found: ${chunk}`);
        chunks[chunk - 1] = 1;
    });

    const missingChunks: number[] = [];
    // Loop over the array to find missing chunks
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i] === 0) {
            missingChunks.push(i + 1);
        }
    }

    return missingChunks;
};

export const combineChunks = async (id: string): Promise<boolean> => {
    let result = false;
    try {
        // get all existing chunks for this client and id
        const Contents = fs
            .readdirSync(folderPath)
            .filter((value) => value.includes(id))
            .filter((value) => value.endsWith('.wav'));

        const listFileName = `${folderPath}${id}_list.txt`;
        let fileNames = '';

        // generate list file with "file chunkPath.wav newline" for each chunk
        Contents.forEach((chunk) => {
            fileNames += `file ${folderPath}${chunk} \n`;
        });

        fs.writeFileSync(listFileName, fileNames);

        const merge = ffmpeg();
        return new Promise((resolve) => {
            merge
                .input(listFileName)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions('-c copy')
                .save(`${folderPath}${id}.wav`)
                .on('end', () => {
                    // Delete all chunks
                    Contents.forEach((chunk) => {
                        fs.unlinkSync(`${folderPath}${chunk}`);
                    });
                    // Delete list file
                    fs.unlinkSync(listFileName);

                    result = true;
                    return resolve(result);
                })
                .on('error', (err) => {
                    console.log(err);
                    return resolve(result);
                });
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(result);
    }
};

export const getAudioPath = (id: string): string | undefined => {
    return findUploadFile(id + '.wav');
};

export const getMetadataPath = (id: string): string | undefined => {
    return findUploadFile(id + '.json');
};

const findUploadFile = (file: string): string | undefined => {
    try {
        const Contents = fs
            .readdirSync(folderPath)
            .filter((value) => value.includes(file));

        if (Contents.length !== 1) {
            throw new Error('Too many matches when uploading to s3 bucket.');
        }

        return folderPath + Contents[0];
    } catch (err) {
        console.log(err);
    }
};

/**
 * Deletes the recording of the specified id, all chunks and metadata
 * @param id the id of the recording to be deleted min 45 chars
 * @returns true if successfully deleted, otherwise false
 */
export const deleteRecording = (id: string): boolean => {
    const minSize = 45; // length of uuid v4 (36) plus _client_x (9)

    // If too short return false, no files deleted
    if (id.length < minSize) {
        return false;
    }

    try {
        // Find all files matching id
        const Contents = fs
            .readdirSync(folderPath)
            .filter((value) => value.includes(id));

        // Delete all files found
        Contents.forEach((file) => fs.unlinkSync(folderPath + file));

        // Success return true
        return true;
    } catch (err) {
        // Log error and return false
        console.log(err);
        return false;
    }
};
