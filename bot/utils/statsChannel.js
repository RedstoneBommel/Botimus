import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
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

export async function createStatsChannel(guild, option) {
    await loadMeta();
    
    if (!guild) {
        throw new Error('Guild not found');
    }
    
    if (!meta.channel) {
        throw new Error('Meta channel configuration not found');
    }
    
    if (meta.channel[option]) {
        throw new Error(`Channel configuration for ${option} already in meta.json`);
    }
    
    let statsCategory;
    
    if (!guild.channels.cache.some(channel => channel.name === '🔹𝕊𝕖𝕣𝕧𝕖𝕣 𝕊𝕥𝕒𝕥𝕤🔹' && channel.type === ChannelType.GuildCategory)) {
        statsCategory = await guild.channels.create({
            name: '🔹𝕊𝕖𝕣𝕧𝕖𝕣 𝕊𝕥𝕒𝕥𝕤🔹',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: meta.role.member,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect]
                }
            ]
        });
    } else {
        statsCategory = guild.channels.cache.find(channel => channel.name === '🔹𝕊𝕖𝕣𝕧𝕖𝕣 𝕊𝕥𝕒𝕥𝕤🔹' && channel.type === ChannelType.GuildCategory);
    }
    
    if (!statsCategory) {
        throw new Error('Stats category not found or created');
    } else {
        const statsChannel = await guild.channels.create({
            name: `temp-${option}-${Date.now()}`,
            type: ChannelType.GuildVoice,
            parent: statsCategory.id,
        });
        
        meta.channel[option] = statsChannel.id;
        await writeFile(path.join(__dirname, '../meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
        
        switch (option) {
            case 'member_general_stats':
                await updateTotalMembers(guild);
                break;
            case 'member_online_stats':
                await updateOnlineMembers(guild);
                break;
            case 'bot_general_stats':
                await updateTotalBots(guild);
                break;
            default:
                throw new Error(`Unknown option: ${option}`);
        }
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
