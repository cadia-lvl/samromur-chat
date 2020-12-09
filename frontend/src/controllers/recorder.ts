import { AudioInfo, AudioError } from '../types/audio';

import WavEncoder from '../worker';

interface RecorderConfig {
    sampleRate: number;
}

export default class Recorder {
    private microphone?: MediaStream;
    private audioContext!: AudioContext;
    private encoder: WavEncoder;

    private sourceNode!: MediaStreamAudioSourceNode;
    private processorNode!: ScriptProcessorNode;
    private sampleRate: number;

    constructor({ sampleRate }: RecorderConfig) {
        this.sampleRate = sampleRate;
        this.encoder = new WavEncoder();
    }

    private isReady = (): boolean => !!this.microphone;

    private getMicrophone = (): Promise<MediaStream> => {
        return new Promise((resolve, reject) => {
            const options = {
                audio: true,
                channelCount: 1,
                sampleRate: this.sampleRate,
            };

            if (navigator.mediaDevices?.getUserMedia) {
                navigator.mediaDevices
                    .getUserMedia(options)
                    .then(resolve, reject);
            } else if (navigator.getUserMedia) {
                navigator.getUserMedia(options, resolve, reject);
            } else if (navigator.webkitGetUserMedia) {
                navigator.webkitGetUserMedia(options, resolve, reject);
            } else if (navigator.mozGetUserMedia) {
                navigator.mozGetUserMedia(options, resolve, reject);
            } else {
                reject(AudioError.NO_SUPPORT);
            }
        });
    };

    private start = (): Promise<void> => {
        this.processorNode.connect(this.audioContext.destination);
        this.sourceNode.connect(this.processorNode);
        if (!this.isReady()) {
            console.error('Cannot record audio before microhphone is ready.');
            return Promise.reject();
        }

        this.processorNode.onaudioprocess = (ev: AudioProcessingEvent) => {
            this.encoder.postMessage({
                command: 'encode',
                buffer: ev.inputBuffer.getChannelData(0),
            });
        };

        return Promise.resolve();
    };

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
                    data: { blob },
                } = event;
                const url = URL.createObjectURL(blob);
                const duration = await this.getBlobDuration(url);
                resolve({
                    blob,
                    duration,
                    url,
                    sampleRate: this.sampleRate,
                });
            };
            this.encoder.postMessage({
                command: 'finish',
            });
        });
    };

    // Check all the browser prefixes for microhpone support.
    isMicrophoneSupported = (): boolean => {
        return !!(
            navigator.mediaDevices?.getUserMedia ||
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia
        );
    };

    init = async (): Promise<MediaStream> => {
        if (this.isReady()) {
            return Promise.reject();
        }

        this.microphone = await this.getMicrophone();

        const recordingStream = this.microphone.clone();
        const rtcStream = this.microphone.clone();

        this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
        this.sourceNode = this.audioContext.createMediaStreamSource(
            recordingStream
        );
        this.processorNode = this.sourceNode.context.createScriptProcessor(
            2048,
            1,
            1
        );
        this.processorNode.connect(this.audioContext.destination);
        this.sourceNode.connect(this.processorNode);

        return Promise.resolve(rtcStream);
    };

    startRecording = async (): Promise<void> => {
        if (!this.isMicrophoneSupported) {
            return Promise.reject();
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
