import express from 'express';
import { twitch } from './twitch.js';

export const router = express.Router();

router.use('/twitch', twitch);