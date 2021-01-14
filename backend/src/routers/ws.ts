import { express } from '../express/server';
import { Request } from 'express';
import WebSocket from 'ws';
import Chatrooms, { Payload, UserClient } from '../chatrooms';

// Chatroom manager
const chatrooms = new Chatrooms();

// Send message to a client
const sendMessage = (ws: WebSocket, payload: Payload) =>
    ws.send(JSON.stringify(payload));

// Send message to the other client in room
const sendOther = (ws: WebSocket, req: Request, message: Payload) => {
    const other = chatrooms.getOther(ws, req);
    if (other) {
        sendMessage(other.ws, message);
    }
};

// Define router
export const wsRouter = express.Router();

// Define ws endpoint
wsRouter.ws('/:room/:client', (ws: WebSocket, req: Request) => {
    // on connection
    const connected = chatrooms.connect(ws, req);

    if (!connected) {
        console.error('A client tried to connect');
        const payload = { type: 'error', message: 'login_failed' };
        sendMessage(ws, payload);
    } else {
        // Send the other client info about him connecting
        const { clientId } = chatrooms.fromRequest(req);
        sendOther(ws, req, { type: 'client_connected', id: clientId });

        // Send him info about the other client
        const other = chatrooms.getOther(ws, req);
        if (other) {
            const payload = {
                type: 'client_connected',
                id: other.id,
                username: other.username,
                voice: other.voice,
                agreed: other.agreed,
            };
            sendMessage(ws, payload);
        } else {
            // If no other client, send message indicating that this client is the owner
            const payload = { type: 'chatroom_owner' };
            sendMessage(ws, payload);
        }
    }

    ws.on('close', () => {
        const disconnectedClient = chatrooms.disconnect(req);
        if (disconnectedClient) {
            const room = chatrooms.getRoom(req);
            room.forEach((client: UserClient) => {
                const payload = {
                    type: 'client_disconnected',
                    id: disconnectedClient.id,
                };
                sendMessage(client.ws, payload);
            });
            // Make the first user in the room the owner
            if (room.length >= 1) {
                const payload = { type: 'chatroom_owner' };
                sendMessage(room[0].ws, payload);
            }
        }
    });

    ws.on('message', (msg: string) => {
        const message: Payload = JSON.parse(msg) || {};
        const { clientId } = chatrooms.fromRequest(req);

        if (!message || !('type' in message)) {
            // Send back error message
            const payload = { type: 'error', message: 'invalid_json' };
            sendMessage(ws, payload);
        } else {
            switch (message.type) {
                case 'set_agreement':
                case 'set_voice':
                case 'set_username': {
                    const success = chatrooms.setClientParameter(req, message);
                    if (success) {
                        const payload = {
                            id: clientId,
                            ...message,
                            type: 'client_changed',
                            parameter: message.type,
                        };
                        sendOther(ws, req, payload);
                    } else {
                        // Send back error message to client
                        const payload = {
                            type: 'error',
                            message: 'set_failed',
                        };
                        sendMessage(ws, payload);
                    }
                    break;
                }
                case 'ping': {
                    const payload = { type: 'pong', message: '' };
                    sendMessage(ws, payload);
                    break;
                }
                default:
                    sendOther(ws, req, message);
            }
        }
    });
});

export default wsRouter;
