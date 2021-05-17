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
    reference: string;
}

export interface SessionMetadata {
    session_id: string;
    client_a?: ClientMetadata;
    client_b?: ClientMetadata;
}

export const getLocalSessions = (
    showPartial: boolean
): Array<SessionMetadata> => {
    const folderPath = '../uploads/';
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
