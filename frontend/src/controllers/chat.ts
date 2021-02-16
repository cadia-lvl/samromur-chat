import { v4 as uuid } from 'uuid';

import Recorder from './recorder';
import { AudioInfo } from '../types/audio';
import { UserClient } from '../types/user';

export enum ChatState {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
}

export enum VoiceState {
    VOICE_CONNECTED = 'VOICE_CONNECTED',
    VOICE_DISCONNECTED = 'VOICE_DISCONNECTED',
}

export enum CallState {
    HUNG_UP = 'HUNG_UP',
    IDLE = 'IDLE',
    INCOMING_CALL = 'INCOMING_CALL',
    IS_CALLING = 'IS_CALLING',
}

export enum RecordingState {
    NOT_RECORDING = 'NOT_RECORDING',
    RECORDING = 'RECORDING',
    RECORDING_REQUESTED = 'RECORDING_REQUESTED',
}

type Payload = {
    [key: string]: any;
};

export default class Chat {
    private incomingOffer!: RTCSessionDescriptionInit;
    private microphone!: MediaStream;

    onRecordingAgreement!: (clientId: string, value: boolean) => void;
    onAnswered!: () => void;
    onAudioTrack!: (stream: MediaStream) => void;

    onClientsChanged!: (clients: UserClient[]) => void;
    onIsOwnerChanged!: (isOwner: boolean) => void;
    onRecordingStopped!: (recording: AudioInfo) => void;
    onRecordingStateChanged!: (state: RecordingState) => void;
    onVoiceStateChanged!: (state: VoiceState) => void;
    onUpload!: () => void;

    private recorder: Recorder;
    private rtcConnection!: webkitRTCPeerConnection;
    private rtcConfiguration: RTCConfiguration;
    private socket!: WebSocket;
    private socketUrl: string;
    private userClient: UserClient;
    private callState: CallState;
    private chatState: ChatState;
    private recordingState: RecordingState;
    private voiceState: VoiceState;
    private clients: UserClient[];
    private sessionId: string;
    private reconnecting: boolean;
    private timeout: number;
    private timeoutIncrement: number;
    private unsentMessages: Payload[];
    private isChatroomOwner: boolean;
    private isDisconnecting: boolean;

    constructor(socketUrl: string, userClient: UserClient) {
        this.recorder = new Recorder({
            sampleRate: 16000,
        });
        this.socketUrl = socketUrl;
        this.userClient = userClient;
        this.callState = CallState.IDLE;
        this.chatState = ChatState.DISCONNECTED;
        this.recordingState = RecordingState.NOT_RECORDING;
        this.voiceState = VoiceState.VOICE_DISCONNECTED;
        this.sessionId = '';
        this.reconnecting = false;
        this.timeoutIncrement = 500;
        this.timeout = this.timeoutIncrement;
        this.unsentMessages = [];
        this.isChatroomOwner = false;
        this.isDisconnecting = false;

        this.clients = [userClient];

        // Note these are public google STUN servers
        this.rtcConfiguration = {
            iceServers: [
                {
                    urls: ['stun:stun4.l.google.com:19302'],
                },
            ],
        };
        this.init();
    }

    private setCallState = (state: CallState) => (this.callState = state);

    private setChatState = (state: ChatState) => {
        this.chatState = state;
    };

    private setRecordingState = (state: RecordingState) => {
        this.recordingState = state;
        this.onRecordingStateChanged(state);
    };

    private setVoiceState = (state: VoiceState) => {
        this.voiceState = state;
        this.onVoiceStateChanged(state);
    };

    private init = async () => {
        try {
            this.socket = await this.openSocket(this.socketUrl);
            this.setUsername(this.userClient.username);
            this.microphone = await this.recorder.init();

            // Open RTC Connection
            this.rtcConnection = await this.openRTC();

            // Start with voice transmitted
            await this.unMute();

            // start websocket ping pong to keep the connection alive
            this.startPingPong();
        } catch (error) {
            console.error('Error initializing chat, ', error);
        }
    };

    private openSocket = (url: string): Promise<WebSocket> => {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(url);
            socket.onopen = () => {
                this.setChatState(ChatState.CONNECTED);
                resolve(socket);
            };
            socket.onerror = (e) => {
                console.error('WebSocket error.');
                reject(e);
            };
            socket.onclose = () => {
                this.setChatState(ChatState.DISCONNECTED);
                // Try to reconnect if closed
                if (!this.reconnecting && !this.isDisconnecting) {
                    this.reconnect();
                }
            };
            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.onMessage(message);
                } catch (e) {
                    console.error('Error parsing json: ', e);
                }
            };
        });
    };

    private openRTC = async (): Promise<webkitRTCPeerConnection> => {
        try {
            const connection = new webkitRTCPeerConnection(
                this.rtcConfiguration
            );
            // When a remote user adds stream to the peer connection, we display it
            connection.ontrack = (event: RTCTrackEvent) => {
                const remoteAudio = event.streams[0];
                this.onAudioTrack(remoteAudio);
            };

            // Setup ice handling
            connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    this.sendMessage({
                        type: 'candidate',
                        candidate: event.candidate,
                    });
                }
            };

            // Setup stream listening
            if (!this.microphone) {
                return Promise.reject('No microphone found.');
            }
            this.microphone.getTracks().forEach((track: MediaStreamTrack) => {
                connection.addTrack(track, this.microphone);
            });
            return Promise.resolve(connection);
        } catch (error) {
            return Promise.reject(error);
        }
    };

    /**
     * Sends ping to the server which should respond with pong
     * This ping ponging keeps the websocket connection open between server and client.
     */
    private startPingPong() {
        const payload = { type: 'ping', message: '' };
        this.sendMessage(payload);
    }

    /**
     * Handles the pong return from the server, restarts the ping
     * after a delay of 30 seconds.
     */
    private handlePong() {
        setTimeout(() => this.startPingPong(), 30 * 1000);
    }

    /**
     * Checks if the websocket is open and ready for messaging
     */
    private isWebSocketOpen = () => {
        return this.socket.readyState === this.socket.OPEN;
    };

    /**
     * Sends all the messages that the client tried to send while not connected to the server.
     */
    private sendUnsentMessages = () => {
        let delay = 250;
        this.unsentMessages.forEach((message: Payload) => {
            setTimeout(() => this.sendMessage(message), delay);
            console.log(
                `Sending unsent message after: ${delay} milliseconds.`,
                message
            );
            delay += 250;
        });
        this.unsentMessages = [];
    };

    /**
     * Reconnect will start a process to reconnect.
     * The process will attempt to reconnect to the WebSocket server
     * every timeout milliseconds
     */
    private reconnect = async () => {
        // If not reconnecting, set to reconnecting and reset timeout
        if (!this.reconnecting) {
            this.reconnecting = true;
            this.timeout = this.timeoutIncrement;
        }
        console.warn(
            'Connection with WebSocket is lost. Attempting to reconnect...'
        );
        try {
            this.socket = await this.openSocket(this.socketUrl);
        } catch (error) {
            console.error('Error reconnecting to the server.');
        }
        this.reconnecting = !this.isWebSocketOpen();
        if (this.reconnecting) {
            this.timeout = Math.min(
                10000,
                this.timeout + this.timeoutIncrement
            );
            setTimeout(async () => {
                await this.reconnect();
            }, this.timeout);
        }
        // Succefully reconnected
        // Send all the stored messages and client name
        if (!this.reconnecting) {
            this.setUsername(this.userClient.username);
            this.sendUnsentMessages();
            console.info('Successfully reconnected to the server.');
            return Promise.resolve('Successfully reconnected to the server.');
        }
    };

    /**
     * Sends a message over the WebSocket connection.
     * If the connection is closed, the function starts a the reconnect process
     * and stores any unsent messages in the unsentMessages array.
     * @param payload the message to send
     */
    private sendMessage = (payload: { [key: string]: any }): Promise<void> => {
        try {
            if (this.isWebSocketOpen()) {
                this.socket.send(JSON.stringify(payload));
                return Promise.resolve();
            }
            if (!this.reconnecting && !this.isDisconnecting) {
                // Lost websocket connection, attempt to reconnect.
                this.reconnect();
            }
            // store the message as unsent
            this.unsentMessages.push(payload);
            return Promise.reject(
                'Unable to send message over the WebSocket connection.'
            );
        } catch (error) {
            console.error('Error sending message, ', error);
            return Promise.reject();
        }
    };

    private onMessage = (message: any) => {
        switch (message.type) {
            case 'client_connected':
                this.handleNewClient(message);
                break;
            case 'client_disconnected':
                this.handleClientDisconnected(message.id);
                break;
            case 'client_changed':
                this.handleClientChanged(message);
                break;
            case 'call':
                this.handleIncomingCall(message);
                break;
            case 'answer':
                this.handleIncomingAnswer(message);
                break;
            case 'candidate':
                this.handleIncomingCandidate(message);
                break;
            case 'set_session_id':
                this.handleSessionId(message.id);
                break;
            case 'start_recording':
                this.handleStartRecording();
                break;
            case 'stop_recording':
                this.handleStopRecording();
                break;
            case 'cancel_recording':
                this.handleCancelRecording();
                break;
            case 'hang_up':
                this.handleHangUp();
                break;
            case 'error':
                console.error('Error: ', message.message);
                break;
            case 'chatroom_owner':
                this.handleIsChatRoomOwner();
                break;
            case 'upload':
                this.handleUpload();
                break;
            case 'pong':
                this.handlePong();
                break;
            default:
                console.error('Misunderstood, ', message);
        }
    };

    private handleSessionId = (id: string) => {
        // _client_b is appended for the user recieving recording
        this.sessionId = id + '_client_b';
    };

    private updateClient = async (
        id: string,
        update: { [type: string]: any }
    ): Promise<UserClient[]> => {
        // Wait for array update before updating the state
        const newClients: UserClient[] = await Promise.all(
            this.clients.map((client) =>
                client.id === id
                    ? Promise.resolve({ ...client, ...update })
                    : Promise.resolve(client)
            )
        );

        return Promise.resolve(newClients);
    };

    private handleNewClient = (message: any) => {
        const user: UserClient = {
            ...message,
        };
        // If the client is not in the clients list add it and trigger onClientsChanged.
        if (!this.clients.some((client: UserClient) => client.id === user.id)) {
            this.clients.push(user);
            this.onClientsChanged(this.clients);
        }
    };

    private handleClientDisconnected = (id: string) => {
        const newClients = this.clients.filter(
            (client: UserClient) => client.id !== id
        );
        this.clients = newClients;
        this.onClientsChanged(this.clients);
    };

    private handleClientChanged = async (message: any) => {
        const update: { [key: string]: any } = {};
        switch (message.parameter) {
            case 'set_username':
                update.username = message.value;
                break;
            case 'set_agreed':
                update.agreed = message.value;
                break;
            case 'set_voice':
                update.voice = message.value;
                break;
        }
        this.clients = await this.updateClient(message.id, update);
        this.onClientsChanged(this.clients);
    };

    private setUsername = async (username: string): Promise<void> => {
        return this.sendMessage({ type: 'set_username', value: username });
    };

    private handleIncomingCall = async (message: any) => {
        this.incomingOffer = message.offer;
        this.setCallState(CallState.INCOMING_CALL);
        await this.answer();
    };

    private handleIncomingAnswer = async (message: any) => {
        try {
            const description = new RTCSessionDescription(message.answer);
            await this.rtcConnection.setRemoteDescription(description);
        } catch (error) {
            // To-do error handling?
            console.error('Error handling incoming answer, ', error);
        }
    };

    private handleIncomingCandidate = async (message: any) => {
        const candidate = new RTCIceCandidate(message.candidate);
        try {
            this.rtcConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Error handling ice candidate');
        }
    };

    private handleStartRecording = async () => {
        try {
            this.setRecordingState(RecordingState.RECORDING_REQUESTED);
        } catch (error) {
            // To-do error handling?
            console.error('Error handling start recording, ', error);
        }
    };

    private handleStopRecording = async () => {
        try {
            this.setRecordingState(RecordingState.NOT_RECORDING);
            const recording = await this.recorder.stopRecording();

            // Inject sessionid
            recording.id = this.sessionId;
            this.onRecordingStopped(recording);
        } catch (error) {
            // To-do error handling?
            console.error('Error handling stop recording, ', error);
        }
    };

    private handleCancelRecording = async () => {
        this.setRecordingState(RecordingState.NOT_RECORDING);
    };

    private handleHangUp = async () => {
        this.rtcConnection.close();
        this.rtcConnection = await this.openRTC();
        this.setCallState(CallState.HUNG_UP);
    };

    public unMute = async () => {
        this.setVoiceState(VoiceState.VOICE_CONNECTED);
        this.recorder.unMute();
        const unmuted = this.clients.find(
            (client: UserClient) => client.voice === true
        );
        if (unmuted) {
            this.call();
        }
        this.handleClientChanged({
            id: this.userClient.id,
            parameter: 'set_voice',
            value: true,
        });
        this.sendMessage({
            id: this.userClient.id,
            type: 'set_voice',
            value: true,
        });
    };

    public mute = async () => {
        this.setVoiceState(VoiceState.VOICE_DISCONNECTED);
        this.recorder.mute();
        this.hangUp();
        this.handleClientChanged({
            id: this.userClient.id,
            parameter: 'set_voice',
            value: false,
        });
        this.sendMessage({
            id: this.userClient.id,
            type: 'set_voice',
            value: false,
        });
    };

    private call = async (): Promise<void> => {
        try {
            const offer: RTCSessionDescriptionInit = await this.rtcConnection.createOffer();
            await this.rtcConnection.setLocalDescription(offer);
            await this.sendMessage({ type: 'call', offer });
            this.setCallState(CallState.IS_CALLING);
            return Promise.resolve();
        } catch (error) {
            console.error('Error calling, ', error);
            return Promise.reject();
        }
    };

    private answer = async (): Promise<void> => {
        try {
            // Handle incoming offer
            const description = new RTCSessionDescription(this.incomingOffer);
            this.rtcConnection.setRemoteDescription(description);

            // Create an answer to offer
            const answer = await this.rtcConnection.createAnswer();
            this.rtcConnection.setLocalDescription(answer);

            // Send answer
            this.sendMessage({ type: 'answer', answer });
            return Promise.resolve();
        } catch (error) {
            console.error('Error answering, ', error);
            return Promise.reject();
        }
    };

    private handleIsChatRoomOwner = () => {
        this.isChatroomOwner = true;
        this.onIsOwnerChanged(this.isChatroomOwner);
    };

    public isOwner = (): boolean => {
        return this.isChatroomOwner;
    };

    public hangUp = async (): Promise<void> => {
        this.rtcConnection?.close();
        this.rtcConnection = await this.openRTC();
        //this.setCallState(CallState.HUNG_UP);
        return this.sendMessage({ type: 'hang_up' });
    };

    // Todo
    public sendAgreement = async (value: boolean): Promise<void> => {
        this.sendMessage({
            id: this.userClient.id,
            type: 'set_agreement',
            value,
        });
    };

    public startRecording = async (): Promise<void> => {
        try {
            await this.recorder.startRecording();
            this.setRecordingState(RecordingState.RECORDING);

            return Promise.resolve();
        } catch (error) {
            console.error('Error starting recording, ', error);
            return Promise.reject();
        }
    };

    public requestRecording = async (): Promise<void> => {
        try {
            await this.sendMessage({ type: 'start_recording' });
            this.setRecordingState(RecordingState.RECORDING_REQUESTED);

            // When recording is requested, session id is set
            const sessionId = uuid();
            this.sendMessage({ type: 'set_session_id', id: sessionId });

            // _client_a is appended for the user initiating recording
            this.sessionId = sessionId + '_client_a';

            return Promise.resolve();
        } catch (error) {
            console.error('Error requesting recording, ', error);
            return Promise.reject();
        }
    };

    public stopRecording = async (): Promise<void> => {
        try {
            this.sendMessage({ type: 'stop_recording' });
            const recording = await this.recorder.stopRecording();

            // Inject sessionid
            recording.id = this.sessionId;

            this.onRecordingStopped(recording);
            this.setRecordingState(RecordingState.NOT_RECORDING);
            return Promise.resolve();
        } catch (error) {
            console.error('Error stopping recording, ', error);
            return Promise.reject();
        }
    };

    public cancelRecording = async (): Promise<void> => {
        try {
            this.sendMessage({ type: 'cancel_recording' });
            this.setRecordingState(RecordingState.NOT_RECORDING);
            return Promise.resolve();
        } catch (error) {
            console.error('Error cancelling recording, ', error);
            return Promise.reject();
        }
    };

    // Sends the request for other client to upload its recording
    public uploadOther = async (): Promise<void> => {
        await this.sendMessage({ type: 'upload' });
    };

    // Responsible for triggering the upload of this client
    private handleUpload = () => {
        this.onUpload();
    };

    public disconnect = async () => {
        console.log('Disconnecting...');
        this.isDisconnecting = true;
        this.socket.close();
        this.rtcConnection.close();
    };
}
