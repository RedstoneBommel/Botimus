import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const data = new SlashCommandBuilder()
    .setName('permit')
    .setDescription('Permit a member without the moderation role to get temporary moderation access.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
        option.setName('name')
            .setDescription('Select a guild member to get temporary moderation access.')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('duration')
            .setDescription('Select a duration this member should have access to moderation. (Default 1h)')
            .setRequired(false)
            .addChoices( // Duration in min
                { name: '1 Hour', value: '60' },
                { name: '10 Hours', value: '600' },
                { name: '1 Day', value: '1440' },
                { name: '1 Week', value: '10080' },
                { name: '2 Weeks', value: '20160' },
                { name: '1 Month', value: '43800' }
            )
    )

export async function execute(interaction) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const metaPath = path.join(__dirname, '../meta.json');
    const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
    
    const guild = interaction.guild;
    const name = interaction.options.getUser('name');
    const duration = interaction.options.getString('duration');
    const durationMS = parseInt(duration || '60') * 60 * 60; // Duration in ms
    
    if (!guild) {
        return await interaction.editReply({ content: 'This command only works in guilds.' });
    }
    
    const guildMember = await guild.members.fetch(name.id);
    
    if (!guildMember) {
        return await interaction.editReply({ content: 'Member not found.' })
    } else {
        try {
            await guildMember.roles.add(meta.role.temp_moderator);
            
            // send to backend
        } catch (error) {
            console.error('Role adding error:', error);
            return await interaction.editReply({ content: 'Something went wrong while permitting a member.' });
        }
    }
}