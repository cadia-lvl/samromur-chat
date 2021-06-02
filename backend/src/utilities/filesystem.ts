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
    // Filter out chunk wav files
    const jsonList = fs
        .readdirSync(folderPath)
        .map((fileName) => {
            return path.join(folderPath, fileName);
        })
        .filter(
            (value) =>
                value.endsWith('.json') &&
                fs.existsSync(value.replace('.json', '.wav'))
        );

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

/**
 * Check for the chunks related to the input id and expected number of chunks
 * chunkCount and returns an array of the missing chunk numbers.
 * @param id the session id to check for missing chunks on
 * @param chunkCount the expected chunk count
 * @returns an array with the missing chunk numbers, empty if no chunks missing
 */
export const checkForMissingChunks = async (
    id: string,
    chunkCount: number
): Promise<number[]> => {
    // get all existing chunks for this client and id
    const Contents = getChunkFiles(id);

    // If more chunks on the server are more than on the client
    // something has gone wrong
    if (Contents.length === chunkCount) {
        return [];
    }

    // Generate empty array of chunkCount length
    const chunks: number[] = new Array<number>(chunkCount).fill(0);

    // Mark all found values with one
    Contents.forEach((content) => {
        const numberString = content.split(`${id}_`).pop()?.split('.wav')[0]; // remove id and file ending from string
        const chunk: number = parseInt(numberString as string);
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

/**
 * Combines all chunks for the session id (1 client) and
 * returns true if successful false otherwise
 * @param id the session id
 * @returns boolean result
 */
export const combineChunks = async (id: string): Promise<boolean> => {
    let result = false;
    try {
        // get all existing chunks for this client and id
        const Contents = getChunkFiles(id);

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

/**
 * Returns the filepath for the audio file
 * @param id the session id
 * @returns the file path for the audio file
 */
export const getAudioPath = (id: string): string | undefined => {
    return findUploadFile(id + '.wav');
};

/**
 * Returns the filepath for the metadata file
 * @param id the session id
 * @returns the file path for the metadata file
 */
export const getMetadataPath = (id: string): string | undefined => {
    return findUploadFile(id + '.json');
};

/**
 * Helper function to make sure that a file about to be uploaded
 * is unique
 * @param file the filename that should be uploaded
 * @returns the filepath of the file
 */
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
 * Deletes the recording of the specified id,
 * including all chunks and metadata for both clients
 * @param id the id of the recording to be deleted min 36 chars
 * @returns true if successfully deleted, otherwise false
 */
export const deleteRecording = (id: string): boolean => {
    const minSize = 36; // length of uuid v4 (36)
    const sessionId = id.replace(/_client_[a|b]/, ''); // remove _client_x (9)
    let deleted = false;

    // If too short return false, no files deleted
    if (sessionId.length < minSize) {
        return deleted;
    }

    try {
        // Find all files matching id
        const Contents = fs
            .readdirSync(folderPath)
            .filter((value) => value.includes(sessionId));

        // Delete all files found
        Contents.forEach((file) => fs.unlinkSync(folderPath + file));

        // Success return true
        deleted = true;
    } catch (err) {
        throw new Error(err.message);
    }
    return deleted;
};

/**
 * Returns the proper name for a chunk that is about to be added.
 * Takes in a session id and chunk id. If the number of chunks on the server is higher
 * than the chunk id, then chunkfilename will be the largest chunk found plus one.
 * Otherwise return the chunk filename as usual.
 * @param id the session id
 * @param chunkId id of the chunk that want to be added
 * @param isMissing if the chunk is missing, it should be inserted with its chunk id
 * @returns the filename for the chunk
 */
export const getChunkFileName = (
    id: string,
    chunkId: string,
    isMissing = false
): string => {
    const Contents = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id) && value.includes('.wav'));
    if (Contents.length > parseInt(chunkId) && !isMissing) {
        // Get the largest chunk number
        const maxChunkId = findMaxChunkNumber(Contents, id);
        const newChunkId = (maxChunkId + 1).toString().padStart(4, '0');
        return `${id}_${newChunkId}`;
    }
    return `${id}_${chunkId}`;
};

/**
 * A private helper function to get the largest chunk for the asked id
 * @param list list of all chunks for the session
 * @param id the id of the session
 * @returns the largest chunk found as a number
 */
const findMaxChunkNumber = (list: string[], id: string): number => {
    const numbers: number[] = [];
    for (const item of list) {
        const chunkNumber = parseInt(
            item.split(`${id}_`).pop()?.split('.wav')[0] as string
        );
        numbers.push(chunkNumber);
    }
    return Math.max(...numbers);
};

/**
 * Checks if there is a chunk mismatch between client and server
 * @param id the session id
 * @param chunkCount expected chunk count
 * @returns true if the amount of chunks on the server is not the same as on the client
 */
export const checkChunksMismatch = (
    id: string,
    chunkCount: number
): boolean => {
    const Contents = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id) && value.includes('.wav'));
    return Contents.length > chunkCount;
};

/**
 * If there are chunks missing, then add that information to the metadata file
 * Appends a missing_chunk array of missing chunks to the json file matching the id
 * @param id the session id
 */
export const writeMissingChunksToMetadata = async (
    id: string
): Promise<void> => {
    // Find missing chunks
    const missingChunks = await getMissingChunks(id);

    // If we have any missing chunks, write them to the metadata file
    if (missingChunks.length > 0) {
        // Create file path
        const filePath = folderPath + id + '.json';
        let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Append missing chunks data to metadata
        data = { ...data, missing_chunks: missingChunks };
        fs.writeFileSync(filePath, JSON.stringify(data));
    }
};

/**
 * Finds the missing chunks on the server and
 * returns an array of the missing chunk numbers.
 * @param id the session id
 * @returns returns the chunk numbers missing for the session or an
 * empty array if there are no chunks missing
 */
const getMissingChunks = async (id: string): Promise<number[]> => {
    // Find all chunk files
    const chunksFiles = getChunkFiles(id);
    // Find the max chunk number on server
    const maxChunkOnServer = findMaxChunkNumber(chunksFiles, id);
    // Find missing chunks
    const missingChunks = await checkForMissingChunks(id, maxChunkOnServer);

    return missingChunks;
};

/**
 * Finds all audio files matching the input id
 * @param id the session id
 * @returns an array of string of audio file paths for the id
 */
const getChunkFiles = (id: string): string[] => {
    const chunksFiles = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id) && value.includes('.wav'));
    return chunksFiles;
};

/**
 * Checks if the server is missing audio chunks for the input id.
 * @param id the session id
 * @returns true if the server has audio chunks missing, false otherwise.
 */
export const areChunksMissing = (id: string): boolean => {
    const chunksFiles = getChunkFiles(id);
    const maxChunkOnServer = findMaxChunkNumber(chunksFiles, id);

    return chunksFiles.length != maxChunkOnServer;
};
