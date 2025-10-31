import { MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('Execute static commands on the connected Minecraft server via RCON.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(command => command
        .setName('kick')
        .setDescription('Execute the kick command via RCON.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to kick.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('ban')
        .setDescription('Execute the ban command via RCON.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to ban.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('pardon')
        .setDescription('Execute the pardon command via RCON.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to pardon.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('op')
        .setDescription('Execute the op command via RCON.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to op.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('deop')
        .setDescription('Execute the deop command via RCON.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to deop.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('whitelist')
        .setDescription('Execute the whitelist command via RCON.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Enter the type of whitelist action (add/remove).')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the username to whitelist.')
                .setRequired(true)
        )
    );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    let command = '';
    const username = interaction.options.getString('username');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (subCommand === 'whitelist') {
        const type = interaction.options.getString('type');
        command = `whitelist ${type} ${username}`;
    } else if (['kick', 'ban', 'pardon', 'op', 'deop'].includes(subCommand)) {
        command = `${subCommand} ${username}`;
    } else {
        await interaction.reply({
            content: 'Invalid subcommand.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

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
            const response =  data.response
                .replace("Player", username)
                .replace("The player", username);

            await interaction.editReply(`**Command executed successfully:**\n\`\`\`${response}\`\`\``);
        } else {
            await interaction.editReply(`**Error executing command:** ${data.error}`);
        }
    } catch (error) {
        console.error('Error executing Minecraft RCON command:', error.message);
        await interaction.editReply('There was an error executing the command. Please try again later or contact a developer.');
    }
}