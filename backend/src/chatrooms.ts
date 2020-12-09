import WebSocket from 'ws';
import { Request } from 'express';

export interface UserClient {
    agreed?: boolean;
    id: string;
    ws: WebSocket;
    username?: string;
    voice?: boolean;
}

export interface Payload {
    [key: string]: any;
}

interface Room {
    [key: string]: UserClient;
}

interface Rooms {
    [key: string]: Room;
}

interface RequestData {
    clientId: string;
    roomId: string;
}

export default class Chatrooms {
    private chatrooms: Rooms;

    constructor() {
        this.chatrooms = {};
    }

    /**
     * Returns clientId and roomId from req url parameters
     */
    fromRequest = (req: Request): RequestData => ({
        clientId: req.params.client,
        roomId: req.params.room,
    });

    /**
     * Connect to a chatroom
     */
    connect = (ws: WebSocket, req: Request): boolean => {
        const { clientId, roomId } = this.fromRequest(req);
        const user: UserClient = {
            id: clientId,
            ws,
        };
        if (this.chatrooms[roomId]) {
            if (this.chatrooms[roomId][clientId]) {
                return false;
            } else {
                // Put user in chatroom
                this.chatrooms[roomId][clientId] = user;
                return true;
            }
        } else {
            // Create chatroom and put user in it
            this.chatrooms[roomId] = {};
            this.chatrooms[roomId][clientId] = user;
            return true;
        }
    };

    /**
     * Set client username
     */
    setClientParameter = (req: Request, payload: Payload): boolean => {
        const { clientId, roomId } = this.fromRequest(req);
        if (this.chatrooms[roomId]) {
            if (this.chatrooms[roomId][clientId]) {
                switch (payload.type) {
                    case 'set_username':
                        this.chatrooms[roomId][clientId].username =
                            payload.value;
                        break;
                    case 'set_agreement':
                        this.chatrooms[roomId][clientId].agreed = payload.value;
                        break;
                    case 'set_voice':
                        this.chatrooms[roomId][clientId].voice = payload.value;
                        break;
                }
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    /**
     * Return websockets of all clients in chat room
     */
    getRoom = (req: Request): UserClient[] => {
        const { roomId } = this.fromRequest(req);
        const room = this.chatrooms[roomId];
        if (room) {
            return Object.values(room);
        } else {
            return [];
        }
    };

    /**
     * Return websockets of the other other client
     */
    getOther = (ws: WebSocket, req: Request): UserClient | undefined => {
        const { roomId } = this.fromRequest(req);
        const room = this.chatrooms[roomId];
        if (room) {
            return Object.values(room).find(
                (client: UserClient) => ws != client.ws
            );
        } else {
            return;
        }
    };

    /**
     * Disconnect from a chatroom
     */
    disconnect = (req: Request): UserClient | undefined => {
        const { clientId, roomId } = this.fromRequest(req);
        if (this.chatrooms[roomId]) {
            const client = this.chatrooms[roomId][clientId];
            if (client) {
                delete this.chatrooms[roomId][clientId];
                return client;
            }
        }
    };
}
