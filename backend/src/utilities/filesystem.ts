import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import archiver from 'archiver';

export const saveDemographics = async (
    age: string,
    gender: string,
    id: string
) => {
    return new Promise((resolve, reject) => {
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
}

export interface SessionMetadata {
    session_id: string;
    client_a: ClientMetadata;
    client_b: ClientMetadata;
}

export const getLocalSessions = (): Array<SessionMetadata> => {
    const folderPath = '../uploads/';
    let clientSessions: Array<SessionMetadata> = [];

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
        let client_b = clientbMetas.find(
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

    if (!Contents) {
        return res.status(500).send('Invalid_id');
    }
    const archive = archiver('zip', {
        zlib: { level: 6 }, // Sets the compression level.
    });

    // Catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
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
