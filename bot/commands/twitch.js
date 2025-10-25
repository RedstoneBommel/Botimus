import axios from 'axios';
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import dotenv from 'dotenv';

dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Get Twitch Notifications and other Twitch data.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command => command
        .setName('get')
        .setDescription('Get the current Twitch status of any Twitch Streamer.')
        .addStringOption(option => option
            .setName('streamer')
            .setDescription('The name of the Twitch streamer')
            .setRequired(true)
        )
    )
    // .addSubcommand(command => command
    //     .setName('notification-add')
    //     .setDescription('Add a Streamer to your private Twitch Notification list.')
    //     .addStringOption(option => option
    //         .setName('streamer')
    //         .setDescription('The name of the Twitch streamer')
    //         .setRequired(true)
    //     )
    // )
    // .addSubcommand(command => command
    //     .setName('notification-remove')
    //     .setDescription('Remove a Streamer from your private Twitch Notification list.')
    //     .addStringOption(option => option
    //         .setName('streamer')
    //         .setDescription('The name of the Twitch streamer')
    //         .setRequired(true)
    //     )
    // );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const streamer = interaction.options.getString('streamer').toLowerCase();

    await interaction.deferReply({ flags: 64 });

    try {
        if (subCommand === 'get') {
            const live_response = await axios.get(`${process.env.BACKEND_URL}/api/twitch/live/${streamer}`, {
                validateStatus: (status) => status >= 200 && status <= 404
            });
            const user_response = await axios.get(`${process.env.BACKEND_URL}/api/twitch/user/${streamer}`);
            let embed;

            if (live_response.status === 200) {
                embed = new EmbedBuilder()
                    .setColor('#a970ff')
                    .setTitle(`${live_response.data.user_name} is currently ${live_response.data.type}`)
                    .addFields(
                        { name: 'Stream Title:', value: live_response.data.type === 'live' ? live_response.data.title : '/', inline: false },
                        { name: 'Category:', value: live_response.data.type === 'live' ? live_response.data.game_name : '/', inline: true },
                        { name: 'Viewer:', value: live_response.data.type === 'live' ? live_response.data.viewer_count.toString() : '/', inline: true },
                        { name: `Link to ${live_response.data.type === 'live' ? 'Stream' : 'Profile'}`, value: `[www.twitch.tv/${streamer}](https://www.twitch.tv/${streamer})`, inline: false }
                    )
                    .setThumbnail(user_response.data.profile_image_url)
            } else if (live_response.status === 404) {
                if (user_response.status === 200) {
                    embed = new EmbedBuilder()
                        .setColor('#a970ff')
                        .setTitle(`${user_response.data.display_name} is currently offline`)
                        .addFields(
                            { name: 'Link to Profile', value: `[www.twitch.tv/${streamer}](https://www.twitch.tv/${streamer})`, inline: false }
                        )
                        .setThumbnail(user_response.data.profile_image_url)
                }
            }
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
};