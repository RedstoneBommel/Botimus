import dotenv from 'dotenv';

dotenv.config();

export function header(port) {
    return `${port} - ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} |`;
}