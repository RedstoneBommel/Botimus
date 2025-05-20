import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import { getTwitchAccessToken } from '../services/twitchAuth.js';

dotenv.config();

export const twitch = express.Router();

twitch.get('/live/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const token = await getTwitchAccessToken();
        const response = await axios.get(`${process.env.TWITCH_API_URL}/streams?user_login=${username}`, {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.data.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(response.data.data[0]);
    } catch (error) {
        console.error('Error with Twitch API:' , error.response?.data || error.message);
        res.status(500).json({ error: 'Error with Twitch API'});
    }
});

twitch.get('/user/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const token = await getTwitchAccessToken();
        const response = await axios.get(`${process.env.TWITCH_API_URL}/users?login=${username}`, {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.data.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(response.data.data[0]);
    } catch (error) {
        console.error('Error with Twitch API:' , error.response?.data || error.message);
        res.status(500).json({ error: 'Error with Twitch API'});
    }
});