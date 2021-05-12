import { AudioInfo, AudioError, AudioChunk } from '../types/audio';

import WavEncoder from '../worker';
import { isRecordingSupported } from '../utilities/utils';

// import IndexedDB from '../utilities/indexed-db';
//import { writeBlobToLocalForage } from '../utilities/local-storage';

interface RecorderConfig {
    sampleRate: number;
    //onChunkAvailable: () => void;
    chunkInterval: number;
}

export default class Recorder {
    private microphone?: MediaStream;
    private audioContext!: AudioContext;
    private encoder: WavEncoder;

    private sourceNode!: MediaStreamAudioSourceNode;
    private processorNode!: ScriptProcessorNode;
    private gainNode!: GainNode;
    private sampleRate: number;

    public onChunkReceived: ((audioChunk: AudioChunk) => void) | undefined;
    private chunkInterval: number = 0;

    private isRecording: boolean = false;

    constructor({ sampleRate, chunkInterval }: RecorderConfig) {
        this.sampleRate = sampleRate;
        this.encoder = new WavEncoder();
        this.chunkInterval = chunkInterval;
    }

    private isReady = (): boolean => !!this.microphone;

    private getMicrophone = (): Promise<MediaStream> => {
        return new Promise((resolve, reject) => {
            const options = {
                audio: true,
                channelCount: 1,
                sampleRate: this.sampleRate,
            };

            const deny = (error: MediaStreamError) =>
                reject(
                    ({
                        NotAllowedError: AudioError.MIC_NOT_ALLOWED,
                        NotFoundError: AudioError.NO_MIC,
                    } as { [errorName: string]: AudioError })[error.name] ||
                        error
                );

            if (navigator.mediaDevices?.getUserMedia) {
                navigator.mediaDevices
                    .getUserMedia(options)
                    .then(resolve, deny);
            } else if (navigator.getUserMedia) {
                navigator.getUserMedia(options, resolve, deny);
            } else if (navigator.webkitGetUserMedia) {
                navigator.webkitGetUserMedia(options, resolve, deny);
            } else if (navigator.mozGetUserMedia) {
                navigator.mozGetUserMedia(options, resolve, deny);
            } else {
                reject(AudioError.NO_MIC_SUPPORT);
            }
        });
    };

    private start = (): Promise<void> => {
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.processorNode);
        this.processorNode.connect(this.audioContext.destination);
        if (!this.isReady()) {
            console.error('Cannot record audio before microphone is ready.');
            return Promise.reject();
        }

        this.encoder.onmessage = async (event) => {
            const {
                data: { chunk },
                data: { command },
            } = event;

            console.log(event);

            if (command === 'chunk-available') {
                console.log(chunk);
                //writeDataToLocalBase(data);
                //this.idb.writeBlobToDb(blob);
                //writeBlobToLocalForage(blob);
                console.log('received chunk');
                if (this.onChunkReceived) {
                    this.onChunkReceived(chunk);
                }
            }
        };

        this.processorNode.onaudioprocess = (ev: AudioProcessingEvent) => {
            const downsampled = this.downsampleBuffer(ev.inputBuffer, 16000);
            this.encoder.postMessage({
                command: 'encode',
                buffer: downsampled,
            });
            //this.encoder.postMessage({ command: 'getData' });
        };

        if (this.chunkInterval > 0) {
            this.startChunkRequesting();
        }

        this.isRecording = true;
        return Promise.resolve();
    };

    private startChunkRequesting = () => {
        setTimeout(() => this.requestChunk(), this.chunkInterval * 1000);
    };

    private requestChunk = () => {
        // if recording
        if (this.isRecording) {
            this.encoder.postMessage({ command: 'get-chunk' });
            console.log('chunk requested, recorder.');
            this.startChunkRequesting();
        }
    };

    // Now the desired sample rate of wave might not match the sample rate of
    // the recording, gotta downsample the recording
    private downsampleBuffer(buffer: AudioBuffer, rate: number) {
        if (rate === buffer.sampleRate) {
            return buffer;
        }
        if (rate > buffer.sampleRate) {
            console.error(
                'Downsampling rate is larger than original sample rate'
            );
        }
        const sampleRateRatio = buffer.sampleRate / rate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        const nowBuffering = buffer.getChannelData(0);
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round(
                (offsetResult + 1) * sampleRateRatio
            );
            // Use average value of skipped samples
            let accum = 0,
                count = 0;
            for (
                let i = offsetBuffer;
                i < nextOffsetBuffer && i < buffer.length;
                i++
            ) {
                accum += nowBuffering[i];
                count++;
            }
            result[offsetResult] = accum / count;
            // Or you can simply get rid of the skipped samples:
            // result[offsetResult] = buffer[nextOffsetBuffer];
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }

    private getBlobDuration = async (url: string): Promise<number> => {
        return new Promise((resolve) => {
            const tempVideoEl = document.createElement('video');
            tempVideoEl.src = url;
            tempVideoEl.addEventListener('loadedmetadata', () => {
                resolve(tempVideoEl.duration as number);
            });
        });
    };

    private stop = (): Promise<AudioInfo> => {
        if (!this.isReady()) {
            console.error('Cannot stop audio before microphone is ready.');

            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            this.processorNode.disconnect();
            this.sourceNode.disconnect();
            this.encoder.onmessage = async (event) => {
                const {
                    data: { chunk },
                }: { data: { chunk: AudioChunk } } = event;
                const url = URL.createObjectURL(chunk.blob);
                try {
                    const duration = await this.getBlobDuration(url);
                    this.isRecording = false;
                    resolve({
                        blob: chunk.blob,
                        duration,
                        url,
                        sampleRate: this.sampleRate,
                        nbrOfChunks: chunk.chunkNumber,
                    });
                } catch (error) {
                    reject('Audio has no duration');
                }
            };
            this.encoder.postMessage({
                command: 'finish',
            });
        });
    };

    init = async (): Promise<MediaStream> => {
        if (this.isReady()) {
            return Promise.reject();
        }

        this.microphone = await this.getMicrophone();

        const recordingStream = this.microphone.clone();
        const rtcStream = this.microphone.clone();

        // NOTE: since firefox gives this error message: Connecting AudioNodes from
        // AudioContexts with different sample-rate is currently not supported.
        // SO we need to use the default sampleRate
        // THEN downsample the buffer after recording and before encoding in
        // wave
        this.sampleRate = this.microphone.getAudioTracks()[0].getSettings()
            .sampleRate as number;
        this.audioContext = new (window.AudioContext ||
            window.webkitAudioContext)({ sampleRate: this.sampleRate });
        // Set sample rate to the active one
        this.sampleRate = this.audioContext.sampleRate;

        this.sourceNode = this.audioContext.createMediaStreamSource(
            recordingStream
        );
        this.processorNode = this.sourceNode.context.createScriptProcessor(
            2048,
            1,
            1
        );
        this.gainNode = this.audioContext.createGain();
        this.processorNode.connect(this.audioContext.destination);
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.processorNode);
        this.gainNode.gain.value = 1;

        return Promise.resolve(rtcStream);
    };

    mute = () => {
        if (this.gainNode) {
            this.gainNode.gain.value = 0;
        }
    };

    unMute = () => {
        if (this.gainNode) {
            this.gainNode.gain.value = 1;
        }
    };

    startRecording = async (): Promise<void> => {
        if (!isRecordingSupported()) {
            console.log(AudioError.NO_MIC_SUPPORT);
            return Promise.reject(AudioError.NO_MIC_SUPPORT);
        }
        if (!this.processorNode) {
            // TODO: Throw a predefined error.
            console.error('NO_PROCESSOR_NODE');
            return Promise.reject('NO_PROCESSOR_NODE');
        }
        return this.start();
    };

    stopRecording = async (): Promise<AudioInfo> => this.stop();

    release = () => {
        if (this.microphone) {
            for (const track of this.microphone.getTracks()) {
                track.stop();
            }
        }

        this.microphone = undefined;
    };
}
