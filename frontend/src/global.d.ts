declare global {
    var MediaRecorder: any; // eslint-disable-line no-var
    var webkit: any; // eslint-disable-line no-var

    interface Navigator {
        webkitGetUserMedia: any;
        mozGetUserMedia: any;
        standalone?: boolean;
    }

    interface Window {
        [key: string]: any;
    }

    interface Blob {
        arrayBuffer: () => Promise<ArrayBuffer>;
    }

    interface Worker {
        dataViews: DataView[];
        numSamples: number;
    }
}

export {};
