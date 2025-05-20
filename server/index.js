import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { router } from './routers/routers.js';
import { startWebSocketServer } from './utils/webSocketServer.js';

dotenv.config();

const app = express();
const port = process.env.PORT;
const webSocketPort = process.env.WEB_SOCKET_PORT;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api', router);

app.listen(port, () => {
    startWebSocketServer(webSocketPort);
    
    console.log(`API-Server is running: Port ${port}`);
    console.log(`WebSocket-Server is running: Port ${webSocketPort}`);
});