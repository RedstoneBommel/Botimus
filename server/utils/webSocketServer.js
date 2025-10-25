import WebSocket, { WebSocketServer } from 'ws';
import { header } from '../tools/formattedPrint.js';
import dotenv from 'dotenv';

dotenv.config();

let connectedClient = new Set();

export function startWebSocketServer(port) {
    const webSocketServer = new WebSocketServer({ port });
    
    webSocketServer.on('connection', (webSocket) => {
        console.log(header(process.env.WEB_SOCKET_PORT), 'Bot connected');
        connectedClient.add(webSocket);
        
        webSocket.on('close', () => {
            console.log(header(process.env.WEB_SOCKET_PORT), 'Bot disconnected');
            connectedClient.delete(webSocket);
        });
        
        webSocket.on('message', (message) => {
            console.log(header(process.env.WEB_SOCKET_PORT), 'Message from Bot:', message.toString());
        });
        
        webSocket.on('error', (error) => {
            console.error(header(process.env.WEB_SOCKET_PORT), 'WebSocket error:', error);
        });
    });
};

export function notifyBot(type, action, data) {
    const payload = JSON.stringify({ type, action, ...data });
    
    connectedClient.forEach(webSocket => {
        try {
            if (webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(payload);
            };
        } catch (error) {
            console.error(header(process.env.WEB_SOCKET_PORT), 'Error while sending message:', error);
        };
    });
};