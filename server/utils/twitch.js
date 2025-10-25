import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import { getTwitchAccessToken } from '../services/twitchAuth.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../utils/dataBaseServer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const twitch = express.Router();
export const twitch_verify = express.Router();
export const state_store = express.Router();

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

twitch_verify.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const filePath = path.join(__dirname, '../data/auth/twitch.json');
    let fileContent;

    if (!code || !state) {
        return res.status(400).send('Missing code or state parameter.');
    }

    try {
        fileContent = await readFile(filePath, { encoding: 'utf-8' });
    } catch (error) {
        fileContent = ''; 
    }

    const data = fileContent.trim() ? JSON.parse(fileContent) : {};
    const userId = data[state];

    if (!userId) {
        return res.status(400).send('Invalid state parameter.');
    }

    delete data[state];

    try {
        await writeFile(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8' });
    } catch (error) {
        console.error('Error deleting userId:' , error.message);
    }

    try {
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.TWITCH_REDIRECT_URL
            }
        });

        const { access_token, refresh_token } = tokenResponse.data;
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            }
        });
        const twitchUser = userResponse.data.data[0];
        const twitchId = twitchUser.id;
        const twitchName = twitchUser.login;

        try {
            const [twitch_auths] = await pool.query(
                'SELECT ID FROM twitch_auths WHERE TWITCHID = ?',
                [twitchId]
            );
            const [clients] = await pool.query(
                'SELECT ID FROM clients WHERE DISCORDID = ?',
                [userId]
            );

            if (clients.length === 0) {
                return res.status(400).send('User does not exist.');
            }

            if (twitch_auths.length > 0) {
                return res.status(400).send('Twitch account is already linked to another user.');
            }

            await pool.query(
                'INSERT INTO twitch_auths (CLIENTID, TWITCHID, USERNAME, ACCESSTOKEN, REFRESHTOKEN, CONNECTED) VALUES (?, ?, ?, ?, ?, ?)',
                [clients[0].ID, twitchId, twitchName, access_token, refresh_token, currentDateTime()]
            );

            res.status(200).send('Twitch account successfully linked.');

        } catch (error) {
            console.error('Error validating state:' , error.message);
            return res.status(500).send('Internal Server Error.');
        }
    } catch (error) {
        console.error('Fehler beim Token-Austausch:', error.response?.data || error.message);
        res.status(500).send('Fehler bei der Twitch-Anmeldung.');
    }
});

twitch_verify.post('/store', async (req, res) => {
    const { userId, state } = req.body;

    if (!state || !userId) {
        return res.status(400).json({ error: 'Missing state or userId parameter.' });
    }

    try {
        const filePath = path.join(__dirname, '../data/auth/twitch.json');
        let fileContent;

        try {
            fileContent = await readFile(filePath, { encoding: 'utf-8' });
        } catch (e) {
            fileContent = ''; 
        }

        const data = fileContent.trim() ? JSON.parse(fileContent) : {};
        data[state] = userId;

        await writeFile(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8' });

        res.json({ message: 'State stored successfully.' });
    } catch (error) {
        console.error('Error storing state:', error.message);
        res.status(500).json({ error: 'Error storing state.' });
    }
});

twitch_verify.post('/delete', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter.' });
    }

    try {
        const filePath = path.join(__dirname, '../data/auth/twitch.json');
        const data = JSON.parse(await readFile(filePath, { encoding: 'utf-8' }));

        for (const [state, storedUserId] of Object.entries(data)) {
            if (storedUserId === userId) {
                delete data[state];
            }
        }

        await writeFile(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8' });

        res.json({ message: 'UserId deleted successfully.' });
    } catch (error) {
        console.error('Error deleting userId:' , error.message);
        res.status(500).json({ error: 'Error deleting userId.' });
    }
});

function currentDateTime() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}