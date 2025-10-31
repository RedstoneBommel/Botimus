import { Rcon } from 'rcon-client';
import dotenv from 'dotenv';
import { header } from '../tools/formattedPrint.js';

dotenv.config();

const rconHost = process.env.MINECRAFT_RCON_HOST;
const rconPort = process.env.MINECRAFT_RCON_PORT;
const rconPassword = process.env.MINECRAFT_RCON_PASSWORD;
const port = process.env.PORT;

export async function testRconConnection() {
    let rcon;

    try {
        rcon = new Rcon({
            host: rconHost,
            port: parseInt(rconPort, 10),
            password: rconPassword,
        });
        await rcon.connect();
        console.log(header(port), `RCON connected to ${rconHost}:${rconPort} successfully.`);
        return true;
    } catch (error) {
        console.error(header(port), `RCON connection failed:`, error.message);
        return false;
    } finally {
        if (rcon) {
            await rcon.end();
        }
    }
}

export async function executeRconCommand(command) {
    let rcon;

    try {
        rcon = new Rcon({
            host: rconHost,
            port: parseInt(rconPort, 10),
            password: rconPassword,
        });

        if (await testRconConnection()) {
            await rcon.connect();
        } else {
            throw new Error('RCON is not reachable');

        }

        const response = await rcon.send(command);
        return response;
    } catch (error) {
        console.error(header(port), `RCON command execution failed:`, error.message);
        throw new Error('RCON command execution failed');
    } finally {
        if (rcon) {
            await rcon.end();
        }
    }
}