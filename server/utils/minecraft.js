import dotenv from 'dotenv';
import express from 'express';
import pool from '../utils/dataBaseServer.js';
import { executeRconCommand } from '../services/rcon.js';
import { spawn } from 'child_process';
import path from 'path';
import { header} from '../tools/formattedPrint.js';

dotenv.config();

const port = process.env.PORT;

export const minecraft_verify = express.Router();
export const minecraft_execute = express.Router();

// Execute RCON command
minecraft_execute.post('/command', async (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required.' });
    }

    try {
        const response = await executeRconCommand(command);
        res.status(200).json({ response: response });
    } catch (error) {
        console.error('Error executing RCON command:', error.message);
        res.status(500).json({ error: 'Failed to execute RCON command.' });
    }
});

minecraft_execute.post('/start', async (req, res) => {
    try {
        const batchFilePath = path.join(process.env.MINECRAFT_SERVER_PATH, 'start.bat');
        spawn('cmd.exe', ['/c', 'start', '', batchFilePath]);

        res.status(200).json({
            message: 'Minecraft server is starting.',
        });
    } catch (error) {
        console.error('Error starting Minecraft server:', error.message);
        res.status(500).json({ error: 'Failed to start Minecraft server.' });
    }
});

minecraft_execute.post('/open', async (req, res) => {
    try {
        let verifiedUsersById = [];
        const serverIp = process.env.MINECRAFT_SERVER_IP;
        const [verifiedUsers] = await pool.query(
            `SELECT CLIENTID FROM minecraft_auths`
        );
        
        for (const user of verifiedUsers) {
            const [client] = await pool.query(
                'SELECT DISCORDID FROM clients WHERE ID = ?',
                [user.CLIENTID]
            );

            if (client.length > 0) {
                verifiedUsersById.push(client[0].DISCORDID);
            }
        }

        return res.status(200).json({
            verifiedUsers: verifiedUsersById,
            serverIp
        });
    } catch (error) {
        console.error('Error fetching verified Minecraft users:', error.message);
        return res.status(500).send({ error: 'Internal Server Error.' });
    }
});

// Store verifyed Minecraft account
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
            'INSERT INTO minecraft_auths (CLIENTID, UUID, USERNAME, WHITELISTED) VALUES (?, ?, ?, ?)',
            [clients[0].ID, minecraftUUID, minecraftUsername, 0]
        );
        res.status(200).send('Minecraft account successfully linked.');
    } catch (error) {
        console.error('Error during Minecraft verification:', error.message);
        return res.status(500).send('Internal Server Error.');
    }
});