import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Information about Botimus Prime.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command => command
        .setName('code')
        .setDescription('Get an overview of the Botimus Prime code.')
    )
    .addSubcommand(command => command
        .setName('website')
        .setDescription('For more information and your Discord Server Dashboard visit this Botimus Prime dedicated website.')
    )
    .addSubcommand(command => command
        .setName('card')
        .setDescription('Get a small profile directly in Discord to get some information about Botimus Prime.')
    );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });

    try {
        let embed;
        
        if (subCommand === 'code') {
            embed = new EmbedBuilder()
                .setColor('#F0A07C')
                .setTitle('🤖 Botimus Prime Code Overview')
                .setDescription('Get an overview of the Botimus Prime code and features and commands.')
                .setFields(
                    { name: '📂 GitHub Respository', value: '[Botimus Prime](https://github.com/RedstoneBommel/Botimus-Prime)', inline: false },
                    { name: '👨‍💻 Developer', value: '[RedstoneBommel](https://github.com/RedstoneBommel)', inline: false }
                )
                .setFooter({ text: 'Created with ♥️' });
        } else if (subCommand === 'website') {
            embed = new EmbedBuilder()
                .setColor('#F0A07C')
                .setTitle('🌐 Botimus Prime Website')
                .setDescription('Visit the website to get more information or check out the dashboard to manage Botimus Prime on your Discord Server.')
                .addFields(
                    { name: '🔗 Website-Link', value: '[Website]()', inline: false },
                    { name: '⚙️ Dashboard', value: '[Dashboard]()', inline: false }
                )
                .setFooter({ text: 'Created with ♥️' });
        } else {
            embed = new EmbedBuilder()
                .setColor('#F0A07C')
                .setTitle('🤖 Botimus Prime')
                .setDescription('Your versatile Discord Bot for Moderation, Games, Community and much more.')
                .addFields(
                    { name: '🌟 Version', value: 'v0.0.1', inline: true },
                    { name: '📆 Online since', value: 'May 2025', inline: true },
                    { name: '🧰 Features', value: 'Games, Moderation, Community, Twitch Streaming Support, easy control via dashboard and much more (check out the website)' },
                    { name: '🔗 Website', value: '[botimusprime.de]()', inline: false },
                    { name: '📂 Code', value: '[GitHub](https://github.com/RedstoneBommel/Botimus-Prime)', inline: false }
                )
                .setThumbnail('../../assets/Botimus_Prime.png')
                .setFooter({ text: 'Botimus Prime • developed by RedstoneBommel', iconURL: '../../assets/logo.png' });
        }
        
        await interaction.editReply({ embed: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
};