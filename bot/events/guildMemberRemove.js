import { Events } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const name = Events.GuildMemberRemove;

export async function execute(member) {
    const fancyNumbers = {"0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"};
    const memberGeneralStatsChannel = process.env.MEMBER_GENERAL_STATS_CHANNEL;
    const statsChannel = member.guild.channels.cache.get(memberGeneralStatsChannel);
    const totalMembers = member.guild.memberCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (statsChannel) {
        statsChannel.setName(`📊︱𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}`);
    }
};