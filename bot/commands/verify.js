import { MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { generateUniqueState } from '../utils/security.js';

export const data = new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify yourself to get access to special server functions connected with external services.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command => command
        .setName('twitch')
        .setDescription('Verify your Twitch account to get access to Twitch based server features.')
    )
    .addSubcommand(command => command
        .setName('minecraft')
        .setDescription('Verify your Minecraft account to get access to Minecraft based server features.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter your current Minecraft username.')
                .setRequired(true)
        )
    );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
        case 'twitch':
            const state = generateUniqueState(); 

            const authUrl = `https://id.twitch.tv/oauth2/authorize` +
                `?client_id=${process.env.CLIENT_ID}` +
                `&redirect_uri=${process.env.TWITCH_REDIRECT_URL}` +
                `&response_type=code` +
                `&scope=user:read:email` +
                `&state=${state}`;
            
            try {
                await fetch(`${process.env.BACKEND_URL}/auth/twitch/store`, {
                    method: 'POST',
                    headers: {  'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: interaction.user.id,
                        state: state
                    })
                });
            } catch (error) {
                console.error('Error storing state for Twitch verification:', error.message);
                await interaction.reply({
                    content: 'There was an error initiating the Twitch verification process. Please try again later or contact an developer.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const verifyButton = new ButtonBuilder()
                .setLabel('Verify Twitch')
                .setStyle(ButtonStyle.Link)
                .setURL(authUrl);
            const cancelButton = new ButtonBuilder()
                .setCustomId('verify-cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder()
                .addComponents(verifyButton, cancelButton);
            
            await interaction.reply({
                content: 'Click the button below to verify your Twitch account:',
                components: [row],
                flags: MessageFlags.Ephemeral
            });
            break;

        case 'minecraft':
            const username = interaction.options.getString('username');

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const uuid = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
                .then(res => {
                    if (res.status === 204) return null;
                    return res.json();
                })
                .then(data => data ? data.id : null)
                .catch(error => {
                    console.error('Error fetching Minecraft UUID:', error.message);
                    return null;
                });
            
            if (!uuid) {
                await interaction.editReply({
                    content: `The Minecraft username **${username}** does not exist. Please check the spelling and try again.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            try {
                await fetch(`${process.env.BACKEND_URL}/auth/minecraft/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: interaction.user.id,
                        minecraftUsername: username,
                        minecraftUUID: uuid
                    })
                });
            } catch (error) {
                console.error('Error during Minecraft verification:', error.message);
                await interaction.editReply({
                    content: 'There was an error verifying your Minecraft account. Please try again later or contact an developer.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.editReply({
                content: `Successfully verified your Minecraft account **${username}**! You now have access to Minecraft related server features.`,
                flags: MessageFlags.Ephemeral
            });
            break;
            
        default:
            await interaction.reply({
                content: 'Unknown verification method.',
                flags: MessageFlags.Ephemeral
            });
            break;
    }
}