import { readFile } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchColorData() {
    const filePath = path.join(__dirname, '../data/colorData.json');
    const data = JSON.parse(await readFile(filePath, 'utf-8'));
    let dataObjected;
    
    dataObjected = await Promise.all(data.map(async (key, value) => {
        return {
            name: key,
            value: value
        }
    }));
    
    return dataObjected;
}