import { EmbedBuilder, Events } from "discord.js";
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateTotalBots, updateTotalMembers } from '../utils/statsChannel.js';

export const name = Events.GuildMemberAdd;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function execute(member) {
    try {
        const metaPath = path.join(__dirname, '../meta.json');
        const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
        const joinChannel = meta.channel.join;
        const rulesChannel = meta.channel.rules;
        const botChannel = meta.channel.bot;
        const supportChannel = meta.channel.support;
        const channel = member.guild.channels.cache.get(joinChannel);
        const embed = new EmbedBuilder()
            .setColor('#0000ff')
            .setTitle(`🎉 Welcome to ${member.guild.name}, ${member.user.username}!`)
            .setDescription(
                `Hey <@${member.id}>! We’re so glad you joined us 💫\n\n` +
                `Please make sure to read our <#${rulesChannel}> to understand how everything works.\n` +
                `Once you've read the rules, you’ll need to react with ✅ to confirm your agreement. This will grant you the **Member** role, which is required to access the server and interact with others.\n\n` +
                `By reacting, you agree to follow the rules. Violations will be handled accordingly and may result in consequences.\n` +
                `Need help? Just ask! Our team and community are here to support you. 💬 \n\n`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📜 Read the Rules', value: `<#${rulesChannel}>`, inline: true },
                { name: '🤖 Server own bot!', value: `<#${botChannel}>`, inline: true },
                { name: '🎫 Need Support?', value: `<#${supportChannel}>`, inline: true }
            )
            .setFooter({ text: `Welcome aboard! 🚀` })
            .setTimestamp();
        
        if (!channel) return console.warn('Channel not found!');
        
        await updateTotalMembers(member.guild);
        await updateTotalBots(member.guild);
        
        await channel.send({ embeds: [embed] });
    }
    catch (error) {
        console.error('Error in GuildMemberAdd event:', error);
        throw error;
    }
}