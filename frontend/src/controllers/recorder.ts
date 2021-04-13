import { AudioInfo, AudioError, AudioChunk } from '../types/audio';

import WavEncoder from '../worker';
import { isRecordingSupported } from '../utilities/utils';

interface RecorderConfig {
    sampleRate: number;
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
    private downsampleRate: number;

    public onChunkReceived: ((audioChunk: AudioChunk) => void) | undefined;
    private chunkInterval: number = 0;
    private chunks: Array<AudioChunk> = [];

    private isRecording: boolean = false;

    constructor({ sampleRate, chunkInterval }: RecorderConfig) {
        this.downsampleRate = 16000;
        this.sampleRate = sampleRate;
        this.encoder = new WavEncoder();
        this.chunkInterval = chunkInterval;
        this.chunks = [];
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
                data: { chunk, command },
            } = event;

            // On chunk available forward to listener
            if (command === 'chunk-available') {
                if (this.onChunkReceived) {
                    this.onChunkReceived(chunk);
                    this.chunks.push(chunk);
                }
            }
        };

        this.processorNode.onaudioprocess = (ev: AudioProcessingEvent) => {
            const downsampled = this.downsampleBuffer(
                ev.inputBuffer,
                this.downsampleRate
            );
            this.encoder.postMessage({
                command: 'encode',
                buffer: downsampled,
            });
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
        // if recording ask for chunk
        if (this.isRecording) {
            this.encoder.postMessage({ command: 'get-chunk' });
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

        // Then return full recording (or at least what is present in recorder,
        // this might be less than the full recording if a user has refreshed the page)
        return new Promise((resolve, reject) => {
            this.processorNode.disconnect();
            this.sourceNode.disconnect();
            this.encoder.onmessage = async (event) => {
                const {
                    data: { blob, chunkCount, command },
                } = event;
                if (command === 'finish') {
                    const url = URL.createObjectURL(blob);
                    try {
                        const duration = await this.getBlobDuration(url);
                        this.isRecording = false;
                        resolve({
                            blob,
                            duration,
                            url,
                            sampleRate: this.downsampleRate,
                            chunkCount,
                        });
                    } catch (error) {
                        reject('Audio has no duration');
                    }
                }

                // To handle the last chunk
                if (command === 'chunk-available') {
                    const {
                        data: { chunk },
                    } = event;
                    if (this.onChunkReceived) {
                        this.onChunkReceived(chunk);
                        this.chunks.push(chunk);
                    }
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
        // Clear out current encoder data
        this.clearRecording();
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

    clearRecording = () => {
        this.encoder.postMessage({ command: 'clear' });
        this.chunks = [];
    };

    getMissingChunks = (missingChunks: number[]) => {
        const foundMissingChunks: AudioChunk[] = [];
        for (const missing of missingChunks) {
            foundMissingChunks.push(this.chunks[missing - 1]);
        }
        console.log(`found missing: ${foundMissingChunks}`);
        return foundMissingChunks;
    };
}
