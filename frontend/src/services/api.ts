import axios, { AxiosResponse, AxiosError } from 'axios';
import { AudioInfo } from '../types/audio';
import { UserDemographics } from '../types/user';
import { SessionMetadata } from '../types/sessions';
import { v4 as uuid } from 'uuid';

export const downloadSession = async (id: string): Promise<any> => {
    let pathname = window.location.href;
    if (pathname.includes('localhost')) {
        pathname = pathname.replace('3000', '3030');
    }

    const url = pathname.replace('mamma', 'api/sessions');

    window.location.href = url + '/' + id;
};

export const getSessions = async (): Promise<SessionMetadata[]> => {
    let pathname = window.location.href;
    if (pathname.includes('localhost')) {
        pathname = pathname.replace('3000', '3030');
    }

    const url = pathname.replace('mamma', 'api/sessions');
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
    let pathname = window.location.href;
    if (pathname.includes('localhost')) {
        pathname = pathname.replace('3000', '3030');
    }

    const parts = pathname.split('/');
    parts.splice(parts.length - 1, 0, 'api');
    let url = parts.join('/');

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
    });

    const metadata = new Blob([jsonString], {
        type: 'text/plain',
    });

    let formData: FormData = new FormData();
    formData.append('audio', blob as Blob);
    formData.append('metadata', metadata);

    return axios({
        method: 'POST',
        url: url,
        headers: {
            'Content-Type': 'multipart/form-data',
            id,
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
