import { AudioChunk } from '../types/audio';

class WavEncoder {
    private sampleRate: number;
    private numSamples: number;
    private dataViews: DataView[];
    private chunks: Array<DataView[]>;

    constructor(sampleRate: number) {
        this.sampleRate = sampleRate;
        this.numSamples = 0;
        this.dataViews = [];
        this.chunks = [];
    }

    encode = (buffer: Float32Array) => {
        const length = buffer.length;
        const view = new DataView(new ArrayBuffer(length * 2));
        let offset = 0;
        for (let i = 0; i < length; i++) {
            const x = buffer[i] * 0x7fff;
            view.setInt16(
                offset,
                x < 0 ? Math.max(x, -0x8000) : Math.min(x, 0x7fff),
                true
            );
            offset += 2;
        }
        this.dataViews.push(view);
        this.numSamples += length;
    };

    /**
     * Returns a blob with the current recorded data with a wav header
     * @returns blob with data
     */
    getChunk = async (): Promise<AudioChunk> => {
        const dataViews = [...this.dataViews];
        const view = this.generateWaveHeader();
        dataViews.unshift(view);

        // move dataview into chunks array, and clear current dataview
        this.chunks.push(dataViews);
        this.reset();

        const chunkNumber = this.chunks.length;

        const chunk: AudioChunk = {
            blob: new Blob(dataViews, { type: 'audio/wav' }),
            chunkNumber,
        };

        // return the current chunk
        return Promise.resolve(chunk);
    };

    writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    reset = () => {
        this.numSamples = 0;
        this.dataViews = [];
    };

    // Prepend wav header
    finish = (): Promise<AudioChunk> => {
        return this.getChunk();
    };

    // Create wav header
    private generateWaveHeader = (): DataView => {
        const dataSize = this.numSamples * 2;
        const view = new DataView(new ArrayBuffer(44));
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, this.sampleRate, true);
        // audio files are only mono
        view.setUint32(28, this.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);
        return view;
    };
}

const encoder = new WavEncoder(16000);

export const ctx: Worker = self as any;

const finish = async () => {
    const chunk = await encoder.finish();
    encoder.reset();
    ctx.postMessage({
        command: 'finish',
        chunk: chunk,
    });
};

/**
 * Requests the current data in the recorder
 */
const getAndPostChunk = async () => {
    const chunk = await encoder.getChunk();
    ctx.postMessage({ command: 'chunk-available', chunk: chunk });
};

ctx.onmessage = (event) => {
    const data = event.data;
    switch (data.command) {
        case 'encode':
            encoder.encode(data.buffer);
            break;
        case 'get-chunk':
            getAndPostChunk();
            break;
        case 'finish':
            finish();
            break;
        default:
            console.log('Unknow command sent to encoder.');
    }
};

export default ctx;
