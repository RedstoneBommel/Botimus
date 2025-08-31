import { ActionRowBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function createProfileModal(interaction) {
    const nick = new TextInputBuilder()
        .setCustomId('nick')
        .setLabel('Nickname')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(32)
        .setValue(interaction.user.username)
    
    const birthday = new TextInputBuilder()
        .setCustomId('birthday')
        .setLabel('Birthday')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(10)
        .setPlaceholder('e.g. 01.01.2000')
        .setRequired(false);
    
    const games = new TextInputBuilder()
        .setCustomId('games')
        .setLabel('Favorite Games')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(500)
        .setPlaceholder('e.g. Minecraft, Fortnite, Among Us')
        .setRequired(false);
    
    const aboutMe = new TextInputBuilder()
        .setCustomId('aboutMe')
        .setLabel('About Me')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(1000)
        .setPlaceholder('A short description about yourself')
        .setRequired(false);
    
    const nickActionRow = new ActionRowBuilder().addComponents(nick);
    const birthdayActionRow = new ActionRowBuilder().addComponents(birthday);
    const gamesActionRow = new ActionRowBuilder().addComponents(games);
    const aboutMeActionRow = new ActionRowBuilder().addComponents(aboutMe);
    
    return [nickActionRow, birthdayActionRow, gamesActionRow, aboutMeActionRow];
}

export function updateProfileModal(interaction, profileData) {
    const nick = new TextInputBuilder()
        .setCustomId('nick')
        .setLabel('Nickname')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(32)
        .setValue(profileData.nick || interaction.user.username);
    
    const birthday = new TextInputBuilder()
        .setCustomId('birthday')
        .setLabel('Birthday')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(10)
        .setPlaceholder('e.g. 01.01.2000')
        .setValue(profileData.birthday || '')
        .setRequired(false);
    
    const games = new TextInputBuilder()
        .setCustomId('games')
        .setLabel('Favorite Games')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(500)
        .setPlaceholder('e.g. Minecraft, Fortnite, Among Us')
        .setValue(profileData.games || '')
        .setRequired(false);
    
    const aboutMe = new TextInputBuilder()
        .setCustomId('aboutMe')
        .setLabel('About Me')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(1000)
        .setPlaceholder('A short description about yourself')
        .setValue(profileData.aboutMe || '')
        .setRequired(false);
    
    const nickActionRow = new ActionRowBuilder().addComponents(nick);
    const birthdayActionRow = new ActionRowBuilder().addComponents(birthday);
    const gamesActionRow = new ActionRowBuilder().addComponents(games);
    const aboutMeActionRow = new ActionRowBuilder().addComponents(aboutMe);
    
    return [nickActionRow, birthdayActionRow, gamesActionRow, aboutMeActionRow];
}