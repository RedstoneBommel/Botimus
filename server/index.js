import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { api, auth } from './routers/routers.js';
import { startWebSocketServer } from './utils/webSocketServer.js';
import { header } from './tools/formattedPrint.js';
import pool from './utils/dataBaseServer.js';

dotenv.config();

const app = express();
const port = process.env.PORT;
const webSocketPort = process.env.WEB_SOCKET_PORT;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api', api);
app.use('/auth', auth);

app.listen(port, () => {
    startWebSocketServer(webSocketPort);

    console.log(header(port), `API-Server is running: Port ${port}`);
    console.log(header(port), `WebSocket-Server is running: Port ${webSocketPort}`);
    pool;
});