import { AudioChunk } from '../types/audio';

interface Chunk {
    dataViews: DataView[];
    header: DataView;
    samples: number;
}

class WavEncoder {
    private sampleRate: number;
    private numSamples: number;
    private dataViews: DataView[];
    private chunks: Array<Chunk>;

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
        const header = this.generateWavHeader(this.numSamples);
        const samples = this.numSamples;

        // push chunk into the chunk array
        this.chunks.push({ dataViews, header, samples });

        // move header into the dataviews for the chunk
        const blobViews = [header, ...dataViews];

        const chunkNumber = this.chunks.length;

        const chunk: AudioChunk = {
            blob: new Blob(blobViews, { type: 'audio/wav' }),
            chunkNumber,
        };

        // reset numSamples and dataViews
        this.reset();

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
    finish = (): Promise<Blob> => {
        if (this.dataViews.length !== 0) {
            this.getChunk();
        }

        const dataViews: DataView[] = [];
        let totalSamples: number = 0;
        this.chunks.forEach((chunk) => {
            dataViews.push(...chunk.dataViews);
            totalSamples += chunk.samples;
        });

        const header = this.generateWavHeader(totalSamples);
        dataViews.unshift(header);

        const blob = new Blob(dataViews, { type: 'audio/wav' });

        return Promise.resolve(blob);
    };

    // Create wav header
    private generateWavHeader = (numSamples: number): DataView => {
        const dataSize = numSamples * 2;
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

    getNumberOfChunks = (): number => {
        return this.chunks.length;
    };

    clear = (): void => {
        this.reset();
        this.chunks = [];
    };
}

const encoder = new WavEncoder(16000);

export const ctx: Worker = self as any;

const finish = async () => {
    await getAndPostChunk();

    const blob = await encoder.finish();
    const nbrOfChunks = encoder.getNumberOfChunks();
    encoder.reset();
    ctx.postMessage({
        command: 'finish',
        blob,
        nbrOfChunks,
    });
};

/**
 * Gets the current chunk of audio from the encoder
 * and returns it as an AudioChunk via posting the 'chunk-available' message
 * To access the data a listener needs to be setup to listen for the event.
 */
const getAndPostChunk = async () => {
    const chunk = await encoder.getChunk();
    ctx.postMessage({ command: 'chunk-available', chunk: chunk });
};

const clear = async () => {
    await encoder.clear();
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
        case 'clear':
            clear();
            break;
        default:
            console.log('Unknow command sent to encoder.');
    }
};

export default ctx;
