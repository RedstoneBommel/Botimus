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
        default:
            await interaction.reply({
                content: 'Unknown verification method.',
                flags: MessageFlags.Ephemeral
            });
            break;
    }
}