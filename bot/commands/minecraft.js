import { MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('minecraft')
    .setDescription('Execute commands on the connected Minecraft server via RCON.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
        option.setName('command')
            .setDescription('Enter the RCON command you want to execute.')
            .setRequired(true)
    );

export async function execute(interaction) {
    const command = interaction.options.getString('command');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/minecraft/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: command
            })
        });
        const data = await response.json();

        if (response.ok) {
            await interaction.editReply(`**Command executed successfully:**\n\`\`\`${data.response}\`\`\``);
        } else {
            await interaction.editReply(`**Error executing command:** ${data.error}`);
        }
    } catch (error) {
        console.error('Error executing Minecraft RCON command:', error.message);
        await interaction.editReply('There was an error executing the command. Please try again later or contact a developer.');
    }
}