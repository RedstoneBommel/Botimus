import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { router } from './routers/routers.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api', router);

app.listen(port, () => {
    console.log(`API-Server is running: Port ${port}`)
});