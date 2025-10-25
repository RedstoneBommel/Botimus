import express from 'express';
import { twitch, twitch_verify, state_store } from '../utils/twitch.js';

export const api = express.Router();
export const auth = express.Router();

api.use('/twitch', twitch);
auth.use('/twitch', twitch_verify);