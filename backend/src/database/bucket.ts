import { config, S3 } from 'aws-sdk';
import { getConfig } from '../utilities/config-helper';
import { Request, Response } from 'express';
import fs from 'fs';
import { getAudioPath, getMetadataPath } from '../utilities/filesystem';

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const s3Zip = require('s3-zip');

if (process.env.HTTP_PROXY) {
    // Currently have no TS typings for proxy-agent, so have to use plain require().
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const proxy = require('proxy-agent');

    config.update({
        httpOptions: { agent: proxy(process.env.HTTP_PROXY) },
    });
}

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

export default class Bucket {
    private s3: S3;
    private bucketName: string;

    constructor() {
        this.s3 = new S3(getConfig().CONFIG);
        this.bucketName = getConfig().BUCKET_NAME;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private assertFolder = (folder: string): Promise<any> => {
        return this.s3
            .putObject({
                Bucket: this.bucketName,
                Key: folder,
            })
            .promise();
    };

    /**
     * Fetch a public url from path.
     */
    getPublicUrl = async (path: string): Promise<string> => {
        return this.s3.getSignedUrl('getObject', {
            Bucket: getConfig().BUCKET_NAME,
            Key: path,
            Expires: 24 * 60 * 30,
        });
    };

    /**
     * Get all folders in s3
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSessions = async (showPartial: boolean): Promise<any> => {
        const { CommonPrefixes } = await this.s3
            .listObjectsV2({
                Bucket: this.bucketName,
                Delimiter: '/',
            })
            .promise();
        const folders = CommonPrefixes?.map(
            (value: S3.CommonPrefix) => value.Prefix as string
        );

        if (folders) {
            const filePaths = await Promise.all(
                folders.map((folder: string) => this.getFilepaths(folder))
            );
            // Only look through folders which have 4 files
            const filtered = showPartial
                ? filePaths
                : filePaths.filter((value) => value.length == 4);
            return Promise.all(
                filtered.map((paths: string[]) =>
                    this.getSession(paths, showPartial)
                )
            );
        } else {
            return Promise.reject('Sessions list error');
        }
    };

    getFilepaths = async (folder: string): Promise<string[]> => {
        const { Contents } = await this.s3
            .listObjectsV2({
                Bucket: this.bucketName,
                Delimiter: '/',
                Prefix: folder,
            })
            .promise();
        const filePaths = Contents?.map(
            (value: S3.Object) => value.Key as string
        ) as string[];
        return Promise.resolve(filePaths);
    };

    getSession = async (
        filePaths: string[],
        showPartial: boolean
    ): Promise<SessionMetadata | void> => {
        const jsonPaths = filePaths.filter((value) => value.endsWith('.json'));
        const metadata = await Promise.all(
            jsonPaths.map((path: string) => this.downloadJson(path))
        );
        const client_a = metadata.find(
            (val) =>
                val.id == 'a' &&
                (showPartial ? true : val.data.duration_seconds)
        );
        const client_b = metadata.find(
            (val) =>
                val.id == 'b' &&
                (showPartial ? true : val.data.duration_seconds)
        );

        if (client_a && client_b) {
            return Promise.resolve({
                session_id: client_a.data.session_id,
                client_a: client_a.data,
                client_b: client_b.data,
            });
        } else if (client_b && showPartial) {
            return Promise.resolve({
                session_id: client_b.data.session_id,
                client_b: client_b.data,
            });
        } else if (client_a && showPartial) {
            return Promise.resolve({
                session_id: client_a.data.session_id,
                client_a: client_a.data,
            });
        }
        // If partial but don't show partial then don't do anything
    };

    downloadJson = async (
        path: string
    ): Promise<{ id: string; data: ClientMetadata }> => {
        const file = await this.s3
            .getObject({
                Bucket: this.bucketName,
                Key: path,
            })
            .promise();
        const stringified = file.Body?.toString() as string;
        const data = JSON.parse(stringified) as ClientMetadata;
        const id = path.includes('client_a') ? 'a' : 'b';
        return Promise.resolve({ id, data });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    downloadSession = async (req: Request, res: Response): Promise<any> => {
        const {
            params: { id },
        } = req;
        const { Contents } = await this.s3
            .listObjectsV2({
                Bucket: this.bucketName,
                Delimiter: '/',
                Prefix: id + '/',
            })
            .promise();
        if (Contents === undefined || Contents.length == 0) {
            return res.status(500).send('Invalid_id');
        }

        const keys = Contents.map(
            (value) => value.Key?.split('/')[1]
        ) as string[];
        try {
            return s3Zip
                .archive({ s3: this.s3, bucket: this.bucketName }, id, keys)
                .pipe(res);
        } catch (error) {
            return res.status(500).send(error);
        }
    };

    /**
     * Uploads the clip and metadata from request to S3 and removes them from uploads folder
     */
    uploadClip = async (req: Request): Promise<void> => {
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        const audio = files['audio'][0];
        const metadata = files['metadata'][0];

        const id = decodeURIComponent(req.headers.id as string);
        const folder = id.replace(/_client_[a|b]/, '') + '/';

        // Create folder if it does not exist;
        await this.assertFolder(folder + '/');

        const clipFilename = folder + id + '.wav';
        const metadataFilename = folder + id + '.json';

        try {
            await this.s3
                .upload({
                    Bucket: this.bucketName,
                    Key: clipFilename,
                    Body: fs.createReadStream(audio.path),
                    ContentType: 'audio/wav',
                })
                .promise();
            fs.unlinkSync(audio.path);

            await this.s3
                .upload({
                    Bucket: this.bucketName,
                    Key: metadataFilename,
                    Body: fs.createReadStream(metadata.path),
                })
                .promise();
            fs.unlinkSync(metadata.path);

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    };

    uploadRecording = async (id: string): Promise<void> => {
        try {
            // Get paths to local files
            const audioPath = getAudioPath(id);
            const metadataPath = getMetadataPath(id);
            if (!audioPath || !metadataPath) {
                throw new Error('metadata or audio files are missing');
            }

            // S3 bucket names
            const folder = id.replace(/_client_[a|b]/, '') + '/';
            const clipFilename = folder + id + '.wav';
            const metadataFilename = folder + id + '.json';

            await this.s3
                .upload({
                    Bucket: this.bucketName,
                    Key: clipFilename,
                    Body: fs.createReadStream(audioPath),
                    ContentType: 'audio/wav',
                })
                .promise();
            fs.unlinkSync(audioPath);

            await this.s3
                .upload({
                    Bucket: this.bucketName,
                    Key: metadataFilename,
                    Body: fs.createReadStream(metadataPath),
                })
                .promise();
            fs.unlinkSync(metadataPath);

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    };
}
