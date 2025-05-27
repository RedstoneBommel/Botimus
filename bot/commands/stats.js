import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createStatsChannel } from "../utils/statsChannel.js";

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show the current server statistics.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(command =>
        command.setName('type')
            .setDescription('Select the type of statistics to display')
            .setRequired(true)
            .addChoices(
                { name: 'Total Members', value: 'member_general_stats' },
                { name: 'Online Members', value: 'member_online_stats' },
                { name: 'Total Bots', value: 'bot_general_stats' }
            )
        )

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const option = interaction.options.getString(subCommand);
    const guild = interaction.guild;
    
    await interaction.deferReply({ ephemeral: true });
    
    if (!guild) {
        return interaction.reply({ content: 'This command can only be used in servers.', ephemeral: true });
    }
    
    if (subCommand === 'type') {
        await createStatsChannel(guild, option);
        
        return interaction.editReply({ content: `Statistics channel created for ${option.replace('_', ' ')}.` });
    }
}