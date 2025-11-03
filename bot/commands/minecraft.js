import { MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('minecraft')
    .setDescription('Execute commands on the connected Minecraft server via RCON.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(subcommand =>
        subcommand.setName('start')
            .setDescription('Start the Minecraft server.')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('stop')
            .setDescription('Stop the Minecraft server.')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('open')
            .setDescription('Send every verified user a message that the server is open with the server ip.')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('command')
            .setDescription('Execute a custom RCON command on the Minecraft server.')
            .addStringOption(option =>
                option.setName('command')
                    .setDescription('Enter the RCON command you want to execute.')
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (subcommand === 'start') {
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/minecraft/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                await interaction.editReply({ content: 'Minecraft server is starting...', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply(`**Error starting Minecraft server:** ${data.error}`);
            }
        } catch (error) {
            console.error('Error executing Minecraft start command:', error.message);
            await interaction.editReply('There was an error executing the command. Please try again later or contact a developer.');
        }
    } else if (subcommand === 'stop') {
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/minecraft/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: 'stop'
                })
            });
            const data = await response.json();

            if (response.ok) {
                await interaction.reply({ content: 'Minecraft server is stopping...', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply(`**Error executing stop command:** ${data.error}`);
            }
        } catch (error) {
            console.error('Error executing Minecraft stop command:', error.message);
            await interaction.editReply('There was an error executing the command. Please try again later or contact a developer.');
        }
    } else if (subcommand === 'open') {
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/minecraft/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                for (const userId of data.verifiedUsers) {
                    const user = await interaction.client.users.fetch(userId);

                    if (user) {
                        user.send(
                            `The Winter SMP 25 Minecraft server is now open!\n
                            As a little reminder, we play on the game version **1.21.10**.\n
                            Connect to the Server please using this IP: **${data.serverIp}**`
                        );
                    }
                }
                await interaction.editReply({ content : 'All verified users have been notified that the server is open.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply(
                    data.error || 'There was an error notifying verified users. Please try again later or contact a developer.'
                );
            }
        } catch (error) {
            console.error('Error executing Minecraft open command:', error.message);
            await interaction.editReply('There was an error executing the command. Please try again later or contact a developer.');
        }
    } else if (subcommand === 'command') {
        const command = interaction.options.getString('command');

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
    } else {
        await interaction.editReply({ content: 'Unknown subcommand. Please try again.', flags: MessageFlags.Ephemeral });
    }
}