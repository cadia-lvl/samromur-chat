import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import archiver from 'archiver';

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
    client_a: ClientMetadata;
    client_b: ClientMetadata;
}

export const getLocalSessions = (): Array<SessionMetadata> => {
    const folderPath = '../uploads/';
    const clientSessions: Array<SessionMetadata> = [];

    // Get all the json files in the folder
    const conversationsList = fs
        .readdirSync(folderPath)
        .map((fileName) => {
            return path.join(folderPath, fileName);
        })
        .filter((value) => value.endsWith('.json'));

    // Read json into ClientMetadata array
    const clientMetas = conversationsList.map((fileName) => {
        // synchronously reads json contents
        const data = JSON.parse(
            fs.readFileSync(fileName, 'utf8')
        ) as ClientMetadata;
        const id = fileName.includes('client_a') ? 'a' : 'b';
        return { id, data };
    });

    const clientaMetas = clientMetas.filter((user) => user.id == 'a');
    const clientbMetas = clientMetas.filter((user) => user.id == 'b');
    // Populate the clientSessions
    clientaMetas.forEach(function (client_a) {
        const client_b = clientbMetas.find(
            (match) => match.data.session_id == client_a.data.session_id
        );
        // If a matching client b exists then create session metadata
        if (client_b) {
            // append session meta to sessions array
            clientSessions.push({
                session_id: client_a.data.session_id,
                client_a: client_a.data,
                client_b: client_b.data,
            });
        }
    });

    return clientSessions;
};

export const downloadLocalSession = async (
    req: Request,
    res: Response
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any> => {
    const {
        params: { id },
    } = req;
    const folderPath = '../uploads/';

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

export const checkForMissingChunks = (
    id: string,
    nbrOfChunks: number
): number[] => {
    const folderPath = '../uploads/';

    // get all existing chunks for this client and id
    const Contents = fs
        .readdirSync(folderPath)
        .filter((value) => value.includes(id))
        .filter((value) => value.endsWith('.wav'));

    if (Contents.length === nbrOfChunks) {
        return [];
    }

    console.log(nbrOfChunks);
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
    console.log(`chunks: ${chunks}`);
    // Loop over the array to find missing chunks
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i] === 0) {
            missingChunks.push(i + 1);
        }
    }

    return missingChunks;
};
