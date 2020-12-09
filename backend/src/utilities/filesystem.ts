import fs from 'fs';
import path from 'path';

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
