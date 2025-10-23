import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchColorData() {
    const filePath = path.join(__dirname, '../data/colorData.json');
    const data = JSON.parse(await readFile(filePath, { encoding: 'utf-8' }));

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const dataObjected = Object.entries(data).map(([name, hexValue]) => {
            return {
                name: name.charAt(0).toUpperCase() + name.slice(1), 
                value: hexValue 
            };
        });
        return dataObjected;
    } 
    else if (Array.isArray(data)) {
        return data.map((name) => ({ name: name, value: name }));
    }
    
    return [];
}