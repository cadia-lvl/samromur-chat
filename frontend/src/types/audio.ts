export const audioFormat = 'audio/wav';

export interface AudioInfo {
    blob?: Blob;
    duration: number;
    id?: string;
    url: string;
    sampleRate: number;
    nbrOfChunks: number;
}

export interface AudioChunk {
    blob: Blob;
    chunkNumber: number;
    id?: string;
}

export interface BlobEvent extends Event {
    data: Blob;
}

export enum RecordingError {
    TOO_SHORT = 'TOO_SHORT',
    TOO_LONG = 'TOO_LONG',
    TOO_QUIET = 'TOO_QUIET',
}

export enum AudioError {
    MIC_NOT_ALLOWED = 'MIC_NOT_ALLOWED',
    NO_MIC = 'NO_MIC',
    NO_MIC_SUPPORT = 'NO_MIC_SUPPORT',
}
