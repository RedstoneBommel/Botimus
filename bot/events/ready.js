import { Events } from 'discord.js';
import dotenv from 'dotenv';
import { updateOnlineMembers, updateTotalMembers } from '../utils/statsChannel.js';

dotenv.config();

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
	const guildId = process.env.GUILD_ID;
	const guild = client.guilds.cache.get(guildId);
	
	await updateTotalMembers(guild);
    await updateOnlineMembers(guild);

    setInterval(async () => {
        await updateOnlineMembers(guild);
    }, 5 * 60 * 1000);
	
	console.log(`Ready! Logged in as ${client.user.tag}`);
}