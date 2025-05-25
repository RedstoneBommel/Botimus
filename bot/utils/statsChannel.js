import dotenv from "dotenv";

dotenv.config();

const memberGeneralStatsChannel = process.env.MEMBER_GENERAL_STATS_CHANNEL;
const memberOnlineStatsChannel = process.env.MEMBER_ONLINE_STATS_CHANNEL;
const fancyNumbers = {
    '0': '𝟬',
    '1': '𝟭',
    '2': '𝟮',
    '3': '𝟯',
    '4': '𝟰',
    '5': '𝟱',
    '6': '𝟲',
    '7': '𝟳',
    '8': '𝟴',
    '9': '𝟵'
};

export async function updateTotalMembers(guild) {
    const totalStatsChannel = guild.channels.cache.get(memberGeneralStatsChannel);
    const totalMembersCount = guild.members.cache.filter(member => !member.user.bot).size;
    const totalMembers = totalMembersCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (totalStatsChannel) {
        await totalStatsChannel.setName(`📊︱𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}`);
    }
};

export async function updateOnlineMembers(guild) {
    const onlineStatsChannel = guild.channels.cache.get(memberOnlineStatsChannel);
    const onlineMembersCount = guild.members.cache.filter(member => (member.presence?.status === 'online' || member.presence?.status === 'idle' || member.presence?.status === 'dnd') && !member.user.bot).size;
    const onlineMembers = onlineMembersCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
    
    if (onlineStatsChannel) {
        await onlineStatsChannel.setName(`🟢︱𝗢𝗻𝗹𝗶𝗻𝗲: ${onlineMembers}`);
    }
};