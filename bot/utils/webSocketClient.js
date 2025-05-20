import dotenv from 'dotenv';
import WebSocket from "ws";

dotenv.config();

export function startWebSocketClient() {
    const webSocket = new WebSocket(process.env.WEB_SOCKET_BACKEND_URL);
    
    webSocket.on('open', () => {
        console.log('[WebSocket-Client] WebSocket connected');
        webSocket.send(JSON.stringify({ action: 'botStarted' }));
    });
    
    webSocket.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('[WebSocket-Client] Nachricht vom Server:', message);
            
            if (message.type === 'moderation') {
                switch(message.action) {
                    case 'temp_ban_end':
                        //call end temporally function
                        break
                    case 'timeout_end':
                        //call end timeout function
                        break
                    case 'temp_permit_end':
                        //call end temporally permit function
                        break
                    default:
                        console.warn('[WebSocket-Client] Unknown moderation-action:', message.action);
                };
            } else if (message.type === 'events') {
                switch(message.action) {
                    case 'birthday':
                        const userId = message.userId;
                        // call birthday function
                        break
                    default:
                        console.warn('[WebSocket-Client] Unknown events-action:', message.action);
                };
            } else if (message.type === 'twitch') {
                if (message.action === 'live-message') {

                } else {
                    console.warn('[WebSocket-Client] Unknown twitch-action:', message.action)
                };
            };
        } catch (error) {
            console.error('[WebSocket-Client] Error while parsing the message:', error);
        };
    });

    webSocket.on('close', () => {
        console.log('[WebSocket-Client] WebSocket disconnected');
    });

    webSocket.on('error', (error) => {
        console.error('[WebSocket-Client] WebSocket error:', error);
    });
};