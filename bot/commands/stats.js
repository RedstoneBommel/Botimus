import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createStatsChannel } from "../utils/statsChannel.js";

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show the current server statistics.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Select the type of statistics to display')
            .setRequired(true)
            .addChoices(
                { name: 'Total Members', value: 'member_general_stats' },
                { name: 'Online Members', value: 'member_online_stats' },
                { name: 'Total Bots', value: 'bot_general_stats' }
            )
        )

export async function execute(interaction) {
    const option = interaction.options.getString('type');
    const guild = interaction.guild;
    
    await interaction.deferReply({ flags: 64 });
    
    if (!guild) {
        return interaction.reply({ content: 'This command can only be used in servers.', flags: 64 });
    }
    
    await createStatsChannel(guild, option);
    
    return interaction.editReply({ content: `Statistics channel created for ${option.replace('_', ' ')}.` });
}