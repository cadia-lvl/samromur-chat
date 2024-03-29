import axios, { AxiosResponse, AxiosError } from 'axios';
import { AudioChunk, AudioInfo } from '../types/audio';
import { UserDemographics } from '../types/user';
import { SessionMetadata } from '../types/sessions';
import { v4 as uuid } from 'uuid';

export const downloadSession = async (id: string): Promise<any> => {
    const endpointurl = getApiUrl('api/sessions/' + id);
    window.location.replace(endpointurl);
};

export const getSessions = async (
    partial?: boolean
): Promise<SessionMetadata[]> => {
    const url = getApiUrl(
        'api/sessions' + (partial ? '?partial=' + partial : '')
    );

    return axios({
        method: 'GET',
        url: url,
    })
        .then((response: AxiosResponse) => {
            return response.data;
        })
        .catch((error: AxiosError) => {
            console.error(error.message);
            return Promise.reject(error.code);
        });
};

export const uploadClip = async (
    clip: AudioInfo,
    demographics: UserDemographics
): Promise<void> => {
    const url = getApiUrl('api/clip');

    const { blob } = clip;
    if (!blob) {
        return Promise.reject();
    }

    const id = clip.id || uuid(); // Generate new id as fallback

    const jsonString = JSON.stringify({
        age: demographics.age,
        duration_seconds: clip.duration,
        gender: demographics.gender,
        sample_rate: clip.sampleRate,
        session_id: id.replace(/_client_[a|b]/, ''),
        reference: demographics.reference,
    });

    const metadata = new Blob([jsonString], {
        type: 'text/plain',
    });

    const formData: FormData = new FormData();
    formData.append('audio', blob as Blob);
    formData.append('metadata', metadata);

    const chunk_id: string = numberToPaddedString(clip.chunkCount);

    return axios({
        method: 'POST',
        url: url,
        headers: {
            'Content-Type': 'multipart/form-data',
            id,
            chunk_id,
        },
        data: formData,
    })
        .then((response: AxiosResponse) => {
            return response.data;
        })
        .catch((error: AxiosError) => {
            console.error(error.message);
            return Promise.reject(error.code);
        });
};

/**
 * Uploads an audio chunk to the server
 * @param chunk the audio chunk to upload
 * @param demographics optional demographics parameter
 * @param isMissing set to true if the chunk is missing on the server
 */
export const uploadChunk = async (
    chunk: AudioChunk,
    demographics?: UserDemographics,
    isMissing: boolean = false
): Promise<void> => {
    const url = getApiUrl('api/chunk');

    const id = chunk.id || uuid(); // Generate new id as fallback

    const formData: FormData = new FormData();
    formData.append('audio', chunk.blob as Blob);

    if (demographics) {
        const jsonString = JSON.stringify({
            age: demographics.age,
            gender: demographics.gender,
            session_id: id.replace(/_client_[a|b]/, ''),
            reference: demographics.reference,
        });

        const metadata = new Blob([jsonString], {
            type: 'text/plain',
        });

        formData.append('metadata', metadata);
    }

    const chunkId: string = numberToPaddedString(chunk.chunkNumber);

    return axios({
        method: 'POST',
        url: url,
        headers: {
            'Content-Type': 'multipart/form-data',
            id,
            chunk_id: chunkId,
            is_missing: isMissing,
        },
        data: formData,
    })
        .then((response: AxiosResponse) => {
            return response.data;
        })
        .catch((error: AxiosError) => {
            console.error(error.message);
            return Promise.reject(error.code);
        });
};

/**
 * Sends a request to the server to verify that
 * the server and clients have matching chunks
 * @param id the session id to verify
 * @param chunkCount the number of chunks on the client
 * @returns a vector containing the ids of the missing chunks on the server.
 * An empty array if all chunks exists.
 */
export const verifyChunks = async (
    id: string,
    chunkCount: number
): Promise<number[]> => {
    const apiUrl = getApiUrl('api/verifyChunks');

    try {
        const resp = await axios({
            method: 'GET',
            url: apiUrl,
            headers: {
                id,
                chunk_count: chunkCount,
            },
        });
        return Promise.resolve(resp.data);
    } catch (error) {
        console.error(error.message);
        return Promise.reject(error.code);
    }
};

/**
 * Posts the recording finished command to the server
 * together with the final metadata.
 * The server will then upload the recording to the s3 bucket.
 * @param recording the recording that is finished
 * @param demographics the demographics of the recording
 * @returns Success if successful an error code or message otherwise
 */
export const recordingFinished = async (
    recording: AudioInfo,
    demographics: UserDemographics
) => {
    const apiUrl = getApiUrl('api/recordingFinished');

    const id = recording.id || uuid(); // Generate new id as fallback

    const jsonString = JSON.stringify({
        age: demographics.age,
        duration_seconds: recording.duration,
        gender: demographics.gender,
        sample_rate: recording.sampleRate,
        session_id: id.replace(/_client_[a|b]/, ''),
        reference: demographics.reference,
    });

    const metadata = new Blob([jsonString], {
        type: 'text/plain',
    });

    const formData: FormData = new FormData();
    formData.append('metadata', metadata);

    try {
        const resp = await axios({
            method: 'POST',
            url: apiUrl,
            headers: {
                'Content-Type': 'multipart/form-data',
                id,
            },
            data: formData,
        });
        return Promise.resolve(resp.data);
    } catch (error) {
        console.error(error.message);
        return Promise.reject(error.code);
    }
};

const getApiUrl = (apiPath: string = 'api') => {
    let pathname = window.location.origin;
    if (pathname.includes('localhost')) {
        pathname = pathname.replace('3000', '3030');
    }

    return `${pathname}/${apiPath}`;
};

const numberToPaddedString = (toPad: number): string => {
    const numberStringSize = 4;
    return toPad.toString().padStart(numberStringSize, '0');
};

/**
 * Sends a request to the server to delete the recording
 * @param id the id of the recording to delete
 * @returns true if deleted false if not
 */
export const removeRecording = async (id: string) => {
    const apiUrl = getApiUrl('api/delete');

    try {
        const resp = await axios({
            method: 'DELETE',
            url: apiUrl,
            headers: {
                id,
            },
        });
        return Promise.resolve(resp.data);
    } catch (err) {
        return Promise.reject(err);
    }
};

/**
 * Uploads a chunk that the server is missing
 * @param chunk the audio chunk to upload
 */
export const uploadMissingChunk = async (chunk: AudioChunk): Promise<void> => {
    return await uploadChunk(chunk, undefined, true);
};
