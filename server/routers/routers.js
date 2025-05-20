import express from 'express';
import { twitch } from '../utils/twitch.js';

export const router = express.Router();

router.use('/twitch', twitch);