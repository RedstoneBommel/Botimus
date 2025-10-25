import dotenv from 'dotenv';

dotenv.config();

export function launchScanner() {
    const data = {
        'twitch': {
            'interval': process.env.INTERVAL_TWITCH_SCAN_LIVE || 300000,
            'function': scanTwitchCurrentLive()
        }
    }

    for (const service in data) {
        const interval = data[service]['interval'];
        const scanFunction = data[service]['function'];

        setInterval(() => {
            scanFunction;
        }, interval);
    }
}