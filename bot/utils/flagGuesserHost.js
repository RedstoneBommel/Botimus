import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { readFile } from 'fs/promises';
import countries from 'i18n-iso-countries';
import path from 'path';

async function registerEnglishLocale(language) {
    try {
        const jsonPath = path.resolve(`./node_modules/i18n-iso-countries/langs/${language}.json`);
        const jsonData = await readFile(jsonPath, 'utf-8');
        const lang = JSON.parse(jsonData);
        countries.registerLocale(lang);
    } catch (error) {
        console.error(`Failed to register locale '${language}':`, error);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateRoundData(language) {
    const allCountries = countries.getNames(language, { select: 'official' });
    const allCountriesArray = Object.entries(allCountries).map(([code, name]) => ({ code, name }));
    let selectedCountriesArray = [];
    
    for (let i = 0; i < 4; i++) {
        selectedCountriesArray.push(allCountriesArray[Math.floor(Math.random() * allCountriesArray.length)]);
    }
    
    const roundData = {
        country: selectedCountriesArray[0].name,
        options: shuffle([
            selectedCountriesArray[0].name,
            selectedCountriesArray[1].name,
            selectedCountriesArray[2].name,
            selectedCountriesArray[3].name
        ]),
        correct: selectedCountriesArray[0].name,
        imageUrl: `https://flagcdn.com/w320/${selectedCountriesArray[0].code.toLowerCase()}.png`
    };
    
    return roundData;
}

export const activeLobbies = new Map(); // Map to store all active lobbies

async function createLobbyEmbed(lobby, language, totalRounds, timeLimit, username) {
    await registerEnglishLocale(language);
    
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Flag Guesser Lobby created by ${username}`)
        .setDescription('Click the button below to join the game!')
        .setThumbnail(generateRoundData(language).imageUrl)
        .addFields(
            { name: 'Total Rounds', value: totalRounds.toString(), inline: true },
            { name: 'Language', value: countries.getName(language, { select: 'official' }) || language, inline: true },
            { name: 'Time Limit', value: timeLimit ? `${timeLimit} seconds` : 'No time limit', inline: true },
            { name: 'Members', value: Array.from(lobby.members).map(id => `<@${id}>`).join('\n') || 'No members yet', inline: true }
        );
}

export async function generateInviteEmbed(interaction, totalRounds = 10, language = 'en', timeLimit = null, hostId) {
    await registerEnglishLocale(language);
    
    activeLobbies.set(interaction.user.id, {
        members: new Set(),
        settings: {
            totalRounds,
            language,
            timeLimit
        }
    });
    
    let closedByHost = false;
    const lobby = activeLobbies.get(hostId);
    const embed = await createLobbyEmbed(lobby, language, totalRounds, timeLimit, interaction.user.username);
    const inviteMessageButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('join_flag_guesser_hosted_by_' + interaction.user.id)
                .setLabel('Join Game')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('leave_flag_guesser_hosted_by_' + interaction.user.id)
                .setLabel('Leave Game')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('close_invite_by_' + interaction.user.id)
                .setLabel('Close Invite')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('start_flag_guesser_hosted_by_' + interaction.user.id)
                .setLabel('Start Game')
                .setStyle(ButtonStyle.Primary)
        );
    await interaction.editReply({ embeds: [embed], components: [inviteMessageButtons] });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 60 * 60 * 1000 }); // Collector for 1 hour
    
    lobby.members.add(hostId);
    const updatedEmbed = await createLobbyEmbed(lobby, lobby.settings.language, lobby.settings.totalRounds, lobby.settings.timeLimit, interaction.user.username);
    await interaction.editReply({ embeds: [updatedEmbed], components: [inviteMessageButtons] });
    
    collector.on('collect', async (i) => {
        if ((i.customId.startsWith('join_flag_guesser') && i.user.id === hostId) || (i.customId.startsWith('leave_flag_guesser') && i.user.id === hostId)) {
            return i.reply({ content: 'You are the Host, you can not use this buttons.', flags: 64 });
        }
        
        if ((i.customId.startsWith('close_invite') && i.user.id !== hostId) || (i.customId.startsWith('start_flag_guesser') && i.user.id !== hostId)) {
            return i.reply({ content: 'You are not the Host, you can not use this buttons.', flags: 64 });
        }
        
        if(i.user.id === hostId) {
            if (i.customId.startsWith('start_flag_guesser')) {
                await i.message.delete();
                
                if (lobby.members.size < 2) {
                    return i.reply({ content: 'You need at least 2 players to start the game!', flags: 64 });
                } else {
                    if (timeLimit) {
                        setTimeout(async () => {
                            await playHostRoundWithTime(interaction, 1, totalRounds, language, timeLimit * 1000);
                        }, 10 * 1000);
                    }
                    else {
                        setTimeout(async () => {
                            await playHostRoundWithoutTime(interaction, 1, totalRounds, language);
                        }, 10 * 1000);
                    }
                    
                    for (const memberId of lobby.members) {
                        try {
                            const member = await interaction.guild.members.fetch(memberId);
                            if (member) {
                                await member.send(`The game has started! You are playing Flag Guesser with ${totalRounds} rounds in ${countries.getName(language, { select: 'official' }) || language}.`);
                            }
                        } catch (error) {
                            console.warn(`Could not send DM to user ${memberId}:`, error);
                        }
                    }
                    
                    await interaction.reply({ content: 'The game is starting! Check your DMs.', ephemeral: false });
                    const startMessage = await interaction.fetchReply();
                    
                    setTimeout(() => {
                        startMessage.delete().catch(() => {});
                    }, 5000);
                }
                return;
            } else if (i.customId.startsWith('close_invite')) {
                activeLobbies.delete(hostId);
                await i.message.delete();
                closedByHost = true;
                await i.reply({ content: 'Invite closed successfully.', flags: 64 });
            } else {
                return i.reply({ content: 'You are the Host, you can not use this button.', flags: 64 });
            }
        } else {
            if (i.customId.startsWith('join_flag_guesser')) {
                if (!lobby) {
                    return i.reply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
                }
                
                if (lobby.members.has(i.user.id)) {
                    return i.reply({ content: 'You have already joined this game!', flags: 64 });
                }
                
                lobby.members.add(i.user.id);
                const updatedEmbed = await createLobbyEmbed(lobby, lobby.settings.language, lobby.settings.totalRounds, lobby.settings.timeLimit, interaction.user.username);
                await i.editReply({ embeds: [updatedEmbed], components: [inviteMessageButtons] });
                return i.reply({ content: 'You have joined the game!', flags: 64 });
            } else if (i.customId.startsWith('leave_flag_guesser')) {
                if (!lobby) {
                    return i.reply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
                }
                
                if (!lobby.members.has(i.user.id)) {
                    return i.reply({ content: 'You have not joined this game!', flags: 64 });
                }
                
                lobby.members.delete(i.user.id);
                const updatedEmbed = await createLobbyEmbed(lobby, lobby.settings.language, lobby.settings.totalRounds, lobby.settings.timeLimit, interaction.user.username);
                await i.editReply({ embeds: [updatedEmbed], components: [inviteMessageButtons] });
                return i.reply({ content: 'You have left the game!', flags: 64 });
            } else {
                return i.reply({ content: 'You are not the Host, you can not use this button.', flags: 64 });
            }
        }
    });
    collector.on('end', async () => {
        try{
            if (!closedByHost) {
                activeLobbies.delete(hostId);
                await message.delete();
            }
        } catch (error) {
            console.error('Error closing lobby and deleting message:', error);
        }
    });
    return message;
}

export async function playHostRoundWithTime(interaction, roundNumber, totalRounds, language, timeLimitMs, correctCount = 0) {
    
}

export async function playHostRoundWithoutTime(interaction, roundNumber, totalRounds, language, correctCount = 0) {
    
}