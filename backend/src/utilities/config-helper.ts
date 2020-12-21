import * as fs from 'fs';
import { S3 } from 'aws-sdk';

export type AmazonS3 = {
    BUCKET_NAME: string;
    CONFIG: S3.Types.ClientConfiguration;
};

export type Config = AmazonS3;

const defaults: Config = {
    BUCKET_NAME: '',
    CONFIG: {},
};

let loadedConfig: Config;

export const getConfig = (): Config => {
    if (loadedConfig) {
        return loadedConfig;
    }

    let config = null;
    try {
        const config_path = process.env.SERVER_CONFIG_PATH || '../config.json';
        config = JSON.parse(fs.readFileSync(config_path, 'utf-8'));
    } catch (err) {
        console.error(err, 'Could not load config.json, using defaults');
    }
    loadedConfig = { ...defaults, ...config };

    return loadedConfig;
};

export const verifyConfig = (): boolean => {
    const config = getConfig();
    if (!config.CONFIG || !config.BUCKET_NAME) {
        return false;
    } else {
        return true;
    }
};
