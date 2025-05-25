import { Events } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const name = Events.ClientReady;
export const once = true;

export function execute(client) {
	const fancyNumbers = {"0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"};
	const guildId = process.env.GUILD_ID;
    const memberGeneralStatsChannel = process.env.MEMBER_GENERAL_STATS_CHANNEL;
	const guild = client.guilds.cache.get(guildId);
    const statsChannel = guild.channels.cache.get(memberGeneralStatsChannel);
    const totalMembers = guild.memberCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
	
	if (statsChannel) {
        statsChannel.setName(`📊︱𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}`);
    }
	
	console.log(`Ready! Logged in as ${client.user.tag}`);
}