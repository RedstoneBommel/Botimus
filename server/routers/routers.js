import express from 'express';
import { twitch, twitch_verify } from '../utils/twitch.js';
import { minecraft_verify } from '../utils/minecraft.js';

export const api = express.Router();
export const auth = express.Router();

api.use('/twitch', twitch);

auth.use('/twitch', twitch_verify);
auth.use('/minecraft', minecraft_verify);