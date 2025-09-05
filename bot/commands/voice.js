import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { existsSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const data = new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Create temporary and private voice channels.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command => command
        .setName('create')
        .setDescription('Setup the voice channel system in this guild.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enter a name for your private voice channel.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('visible')
                .setDescription('Should all members be able to see your private voice channel? (default: false)')
                .setRequired(false)
        )
    )
    .addSubcommand(command => command
        .setName('permit')
        .setDescription('Give a user access to your private voice channel.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Select a user to give access to your private voice channel.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('forbid')
        .setDescription('Remove a users access to your private voice channel.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Select a user to remove access to your private voice channel.')
                .setRequired(true)
        )
    )
    .addSubcommand(command => command
        .setName('delete')
        .setDescription('Delete your private voice channel.')
    );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    switch (subCommand) {
        case 'create':
            if (existsSync(path.join(__dirname, '..', "data/voices", `${interaction.user.id}.json`))) {
                return await interaction.editReply({ content: 'You already have a private voice channel.' });
            } else {
                const channelName = interaction.options.getString('name');
                const visible = interaction.options.getString('visible') === 'true' ? true : false;
                const profilePath = path.join(__dirname, '..', 'data/voices', `${interaction.user.id}.json`);
                const metaPath = path.join(__dirname, '../meta.json');
                const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
                const guild = interaction.guild;
                
                if (!guild) {
                    return await interaction.editReply({ content: 'This command only works in guilds.' });
                }
                
                const voiceChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: meta.categories.private_voice,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: visible ? [
                                PermissionFlagsBits.Connect
                            ] : [
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.ViewChannel
                            ],
                            allow: visible ? [
                                PermissionFlagsBits.ViewChannel
                            ] : []
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak
                            ]
                        }
                    ]
                });
                
                const voiceData = {
                    owner: interaction.user.id,
                    channel_id: voiceChannel.id,
                    name: channelName,
                    visible: visible,
                    permitted: []
                }
                
                await writeFile(profilePath, JSON.stringify(voiceData, null, 4), 'utf-8');
                return await interaction.editReply({content: `Your private voice channel has been created. You can join it here: ${voiceChannel}`});
            }
        case 'permit':
            if (existsSync(path.join(__dirname, '..', "data/voices", `${interaction.user.id}.json`))) {
                const profilePath = path.join(__dirname, '..', 'data/voices', `${interaction.user.id}.json`);
                const profileData = JSON.parse(await readFile(profilePath, 'utf-8'));
                const user = interaction.options.getUser('user');
                const guild = interaction.guild;
                
                if (!guild) {
                    return await interaction.editReply({ content: 'This command only works in guilds.' });
                }
                
                if (!user) {
                    return await interaction.editReply({ content: 'User not found.' });
                }
                
                if (profileData.permitted.includes(user.id)) {
                    return await interaction.editReply({ content: 'This user already has access to your private voice channel.' });
                }
                
                const voiceChannel = await guild.channels.fetch(profileData.channel_id);
                
                if (!voiceChannel) {
                    return await interaction.editReply({ content: 'Your private voice channel could not be found.' });
                }
                
                await voiceChannel.permissionOverwrites.create(user.id, {
                    ViewChannel: true,
                    Connect: true,
                    Speak: true
                });
                
                profileData.permitted.push(user.id);
                
                await writeFile(profilePath, JSON.stringify(profileData, null, 4), 'utf-8');
                return await interaction.editReply({ content: `Successfully gave <@${user.id}> access to your private voice channel.` });
            }
        case 'forbid':
            if (existsSync(path.join(__dirname, '..', "data/voices", `${interaction.user.id}.json`))) {
                const profilePath = path.join(__dirname, '..', 'data/voices', `${interaction.user.id}.json`);
                const profileData = JSON.parse(await readFile(profilePath, 'utf-8'));
                const user = interaction.options.getUser('user');
                const guild = interaction.guild;
                
                if (!guild) {
                    return await interaction.editReply({ content: 'This command only works in guilds.' });
                }
                
                if (!user) {
                    return await interaction.editReply({ content: 'User not found.' });
                }
                
                if (!profileData.permitted.includes(user.id)) {
                    return await interaction.editReply({ content: 'This user does not have access to your private voice channel.' });
                }
                
                const voiceChannel = await guild.channels.fetch(profileData.channel_id);
                
                if (!voiceChannel) {
                    return await interaction.editReply({ content: 'Your private voice channel could not be found.' });
                }
                
                await voiceChannel.permissionOverwrites.delete(user.id);
                
                profileData.permitted = profileData.permitted.filter(id => id !== user.id);
                
                await writeFile(profilePath, JSON.stringify(profileData, null, 4), 'utf-8');
                return await interaction.editReply({ content: `Successfully removed <@${user.id}>'s access to your private voice channel.` });
            }
        case 'delete':
            if (existsSync(path.join(__dirname, '..', "data/voices", `${interaction.user.id}.json`))) {
                const profilePath = path.join(__dirname, '..', 'data/voices', `${interaction.user.id}.json`);
                const profileData = JSON.parse(await readFile(profilePath, 'utf-8'));
                const guild = interaction.guild;
                
                if (!guild) {
                    return await interaction.editReply({ content: 'This command only works in guilds.' });
                }
                
                const voiceChannel = await guild.channels.fetch(profileData.channel_id);
                
                if (voiceChannel) {
                    await voiceChannel.delete('Private voice channel deleted by owner.');
                }
                
                await unlink(profilePath);
                return await interaction.editReply({ content: 'Your private voice channel has been deleted.' });
            }
        default:
            return interaction.editReply({ content: 'Unknown subcommand.' });
    }
}