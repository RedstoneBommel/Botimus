import WebSocket, { WebSocketServer } from 'ws';

let connectedClient = new Set();

export function startWebSocketServer(port) {
    const webSocketServer = new WebSocketServer({ port });
    
    webSocketServer.on('connection', (webSocket) => {
        console.log('[WebSocket-Server] Bot connected');
        connectedClient.add(webSocket);
        
        webSocket.on('close', () => {
            console.log('[WebSocket-Server] Bot disconnected');
            connectedClient.delete(webSocket);
        });
        
        webSocket.on('message', (message) => {
            console.log('[WebSocket-Server] Message from Bot:', message.toString());
        });
        
        webSocket.on('error', (error) => {
            console.error('[WebSocket-Server] WebSocket error:', error);
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
            console.error('[WebSocket-Server] Error while sending message:', error);
        };
    });
};