import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Information about Botimus Prime.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const embed = new EmbedBuilder()
            .setColor('#F0A07C')
            .setTitle('🤖 Botimus Prime')
            .setDescription('Your versatile Discord Bot for Moderation, Games, Community and much more.')
            .addFields(
                { name: '🌟 Version', value: 'v0.0.1', inline: true },
                { name: '📆 Online since', value: 'May 2025', inline: true },
                { name: '🧰 Features', value: 'Games, Moderation, Community, Twitch Streaming Support, easy control via dashboard and much more (check out the website)' },
                { name: '🔗 Website', value: '[botimusprime.de](https://botimusprime.de)', inline: true },
                { name: '📂 Code', value: '[github.com](https://github.com/RedstoneBommel/Botimus)', inline: true },
                { name: '🎮 Discord', value: '[discord.com](https://discord.gg/FNFmENdxP7)', inline: true }
            )
            .setThumbnail('https://raw.githubusercontent.com/RedstoneBommel/Botmius/refs/heads/main/bot/assets/Botimus_Prime.png')
            .setFooter({ text: 'Botimus Prime • developed by RedstoneBommel', iconURL: 'https://raw.githubusercontent.com/RedstoneBommel/Botmius/refs/heads/main/bot/assets/logo.png' });
        
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
};