import dotenv from 'dotenv';
import express from 'express';
import pool from '../utils/dataBaseServer.js';

dotenv.config();

export const minecraft_verify = express.Router();

minecraft_verify.post('/verify', async (req, res) => {
    const { userId, minecraftUsername, minecraftUUID } = req.body;

    if (!userId || !minecraftUsername || !minecraftUUID) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const [minecraft_auths] = await pool.query(
            'SELECT * FROM minecraft_auths WHERE UUID = ?',
            [minecraftUUID]
        );
        const [clients] = await pool.query(
            'SELECT ID FROM clients WHERE DISCORDID = ?',
            [userId]
        );

        if (clients.length === 0) {
            return res.status(400).send('User does not exist.');
        }

        if (minecraft_auths.length > 0) {
            return res.status(400).send('Twitch account is already linked to another user.');
        }

        await pool.query(
            'INSERT INTO minecraft_auths (CLIENTID, UUID, USERNAME) VALUES (?, ?, ?)',
            [clients[0].ID, minecraftUUID, minecraftUsername]
        );
        res.status(200).send('Minecraft account successfully linked.');
    } catch (error) {
        console.error('Error during Minecraft verification:', error.message);
        return res.status(500).send('Internal Server Error.');
    }
});