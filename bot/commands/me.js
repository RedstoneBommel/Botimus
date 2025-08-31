import { ModalBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProfileModal, updateProfileModal } from '../utils/profile.js';

export const data = new SlashCommandBuilder()
    .setName('me')
    .setDescription('Shows a information card about yourself.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

export async function execute(interaction) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        if (existsSync(path.join(__dirname, '..', 'data/clients', `${interaction.user.id}.json`)) === true) {
            const profilePath = path.join(__dirname, '..', 'data/clients', `${interaction.user.id}.json`);
            const profileData = JSON.parse(await readFile(profilePath, 'utf-8'));
            
            console.log('Profile found...');
            
            const modal = new ModalBuilder()
                .setCustomId('updateProfile')
                .setTitle('Update your profile');
            
            modal.addComponents(updateProfileModal(interaction, profileData));
            
            await interaction.showModal(modal);
        } else {
            console.log('No profile found, creating one...');
            
            const modal = new ModalBuilder()
                .setCustomId('createProfile')
                .setTitle('Create your profile');
            
            modal.addComponents(createProfileModal(interaction));
            
            await interaction.showModal(modal);
        
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!'});
    }
}
