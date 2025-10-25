import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function scanTwitchCurrentLive() {
    const filePath = path.join(__dirname, '../../data/auth/twitch.json');
    let data;

    try {
        data = await readFile(filePath, { encoding: 'utf-8' });
    } catch (e) {
        data = '';
    }

    if (!data.trim()) {
        return;
    }

    const authData = JSON.parse(data);
}