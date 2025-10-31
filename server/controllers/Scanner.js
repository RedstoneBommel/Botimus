import dotenv, { parse } from 'dotenv';
import { scanTwitchCurrentLive } from './schedules/twitch.js';
import { scanVerifiedMinecraftUsers } from './schedules/verifiedMinecraftUsers.js';
import { header } from '../tools/formattedPrint.js';

dotenv.config();

const port = process.env.PORT;

export async function launchScanner() {
    const data = {
        'twitch': {
            'interval': process.env.INTERVAL_TWITCH_SCAN_LIVE || 300000,
            'function': scanTwitchCurrentLive
        },
        'minecraft': {
            'interval': process.env.INTERVAL_MINECRAFT_NEW_CLIENTS || 300000,
            'function': scanVerifiedMinecraftUsers
        }
    }

    for (const service in data) {
        const interval = parseInt(data[service]['interval'], 10);
        const scanFunction = data[service]['function'];

        setInterval(() => {
            (async () => {
                try {
                    await scanFunction(); 
                } catch (error) {
                    console.error(header(port), `[Scheduler:${service}] Error while perodic scan:`, error.message);
                }
            })();
        }, interval);
    }
}