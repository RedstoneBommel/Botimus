import { Events, MessageFlags } from 'discord.js';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = Events.InteractionCreate;

export async function execute(interaction) {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral
				});
			}
		}
	} else if (interaction.isModalSubmit()) {
		if (interaction.customId === 'createProfile') {
			try {
				const nick = interaction.fields.getTextInputValue('nick');
				const birthdayStr = interaction.fields.getTextInputValue('birthday');
				const games = interaction.fields.getTextInputValue('games');
				const aboutMe = interaction.fields.getTextInputValue('aboutMe');
				
				const userId = interaction.user.id;
				const username = interaction.user.username;
				
				const [day, month, year] = birthdayStr.split(".");
				const birthday = new Date(`${year}-${month}-${day}`);
				const today = new Date();
				const age = today.getFullYear() - birthday.getFullYear();
				
				const profileData = {
					id: userId,
					username,
					nick,
					age,
					birthday: birthdayStr,
					games: games || null,
					aboutMe: aboutMe || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				
				const profilePath = path.join(__dirname, '..', 'data/clients', `${userId}.json`);
				
				await writeFile(profilePath, JSON.stringify(profileData, null, 4), 'utf-8');
				
				await interaction.reply({
					content: `✅ Profile created successfully, ${username}!`,
					flags: 64
				});
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: '❌ Error, while creating profile!',
					flags: 64
				});
			}
		} else if (interaction.customId === 'updateProfile') {
			try {
				const nick = interaction.fields.getTextInputValue('nick');
				const birthdayStr = interaction.fields.getTextInputValue('birthday');
				const games = interaction.fields.getTextInputValue('games');
				const aboutMe = interaction.fields.getTextInputValue('aboutMe');
				
				const userId = interaction.user.id;
				const username = interaction.user.username;
				
				const [day, month, year] = birthdayStr.split(".");
				const birthday = new Date(`${year}-${month}-${day}`);
				const today = new Date();
				const age = today.getFullYear() - birthday.getFullYear();
				
				const profilePath = path.join(__dirname, '..', 'data/clients', `${userId}.json`);
				const existingProfileData = JSON.parse(await writeFile(profilePath, 'utf-8'));
				
				const updatedProfileData = {
					...existingProfileData,
					nick,
					age,
					birthday: birthdayStr,
					games: games || null,
					aboutMe: aboutMe || null,
					updatedAt: new Date().toISOString()
				};
				
				await writeFile(profilePath, JSON.stringify(updatedProfileData, null, 4), 'utf-8');
				
				await interaction.reply({
					content: `✅ Profile updated successfully, ${username}!`,
					flags: 64
				});
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: '❌ Error, while updating profile!',
					flags: 64
				});
			}
		}
	} else if (interaction.isButton()) {
		// Button Interactions handle Verification Commands
		if (interaction.customId === 'verify-cancel') {
			try {
				await fetch(`${process.env.BACKEND_URL}/auth/twitch/delete`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: interaction.user.id
					})
				});
				
				await interaction.update({ 
					content: 'Der Verifizierungsvorgang wurde abgebrochen.', 
					components: []
				});
			} catch (error) {
				console.error('Error while cancelling verification:', error);
			}
		}
	}
}
