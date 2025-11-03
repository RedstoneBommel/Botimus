import pool from '../../utils/dataBaseServer.js';
import { header } from '../../tools/formattedPrint.js';
import dotenv from 'dotenv';
import { executeRconCommand } from '../../services/rcon.js';

dotenv.config();

const port = process.env.PORT;

export async function scanVerifiedMinecraftUsers() {
    console.log(header(port), 'Scanning for verified Minecraft users...');

    const [minecraft_auths] = await pool.query(
        'SELECT * FROM minecraft_auths WHERE WHITELISTED = 0'
    );

    if (minecraft_auths.length !== 0) {
        for (const auth of minecraft_auths) {
            const response = await executeRconCommand(`whitelist add ${auth.UUID}`);

            if (response.toLowerCase().includes('added to the whitelist')) {
                await pool.query(
                    'UPDATE minecraft_auths SET WHITELISTED = 1 WHERE ID = ?',
                    [auth.ID]
                );
            }
        }
    }   
}