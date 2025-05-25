import { EmbedBuilder, Events } from "discord.js";
import dotenv from 'dotenv';

dotenv.config()

export const name = Events.GuildMemberAdd;

export async function execute(member) {
    const fancyNumbers = {"0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"};
    const joinChannel = process.env.JOIN_CHANNEL;
    const rulesChannel = process.env.RULE_CHANNEL;
    const botChannel = process.env.BOT_CHANNEL;
    const memberGeneralStatsChannel = process.env.MEMBER_GENERAL_STATS_CHANNEL;
    const channel = member.guild.channels.cache.get(joinChannel);
    const statsChannel = member.guild.channels.cache.get(memberGeneralStatsChannel);
    const totalMembers = member.guild.memberCount.toString().split('').map(num => fancyNumbers[num] || num).join('');
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
            { name: '🤖 Server own bot!', value: `<#${botChannel}>`, inline: true }
        )
        .setFooter({ text: `Welcome aboard! 🚀` })
        .setTimestamp();
    
    if (statsChannel) {
        statsChannel.setName(`📊︱𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}`);
    }
    
    if (!channel) return console.warn('Channel not found!');
    
    channel.send({ embeds: [embed] });
}