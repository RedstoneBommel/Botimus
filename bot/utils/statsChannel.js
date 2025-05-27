import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let meta = {};

const fancyNumbers = {
    '0': '𝟬',
    '1': '𝟭',
    '2': '𝟮',
    '3': '𝟯',
    '4': '𝟰',
    '5': '𝟱',
    '6': '𝟲',
    '7': '𝟯',
    '8': '𝟴',
    '9': '𝟵'
};

async function loadMeta() {
    if (Object.keys(meta).length > 0) return;
    try {
        const metaPath = path.join(__dirname, '../meta.json');
        const metaRaw = await readFile(metaPath, 'utf-8');
        meta = JSON.parse(metaRaw);
    } catch (error) {
        console.error('Error reading meta.json:', error);
        throw error;
    }
}

export async function updateTotalMembers(guild) {
    await loadMeta();
    const memberGeneralStatsChannel = meta.channel.member_general_stats;
    const totalStatsChannel = guild.channels.cache.get(memberGeneralStatsChannel);
    const totalMembersCount = guild.members.cache.filter(member => !member.user.bot).size;
    const totalMembers = totalMembersCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (totalStatsChannel) {
        await totalStatsChannel.setName(`📊︱𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}`);
    }
}

export async function updateOnlineMembers(guild) {
    await loadMeta();
    const memberOnlineStatsChannel = meta.channel.member_online_stats;
    const onlineStatsChannel = guild.channels.cache.get(memberOnlineStatsChannel);
    const onlineMembersCount = guild.members.cache.filter(member => (member.presence?.status === 'online' || member.presence?.status === 'idle' || member.presence?.status === 'dnd') && !member.user.bot).size;
    const onlineMembers = onlineMembersCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (onlineStatsChannel) {
        await onlineStatsChannel.setName(`🟢︱𝗢𝗻𝗹𝗶𝗻𝗲: ${onlineMembers}`);
    }
}

export async function updateTotalBots(guild) {
    await loadMeta();
    const botGeneralStatsChannel = meta.channel.bot_channel_stats;
    const totalStatsChannel = guild.channels.cache.get(botGeneralStatsChannel);
    const totalBotsCount = guild.members.cache.filter(member => member.user.bot).size;
    const totalBots = totalBotsCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (totalStatsChannel) {
        await totalStatsChannel.setName(`🤖︱𝗕𝗼𝘁𝘀: ${totalBots}`);
    }
}
