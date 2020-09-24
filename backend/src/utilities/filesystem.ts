import fs from 'fs';

export const saveDemographics = async (age: string, gender: string, id: string) => {
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
        })
    });
}