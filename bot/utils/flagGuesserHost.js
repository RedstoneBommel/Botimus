import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import countries from 'i18n-iso-countries';
import path from 'path';

dotenv.config();

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
    
    if (activeLobbies.has(hostId)) {
        return interaction.editReply({ content: 'You already have an active lobby. Please close it before creating a new one. If you can not find the old lobby embed message use the command to remove your old lobby.', flags: 64 });
    }
    
    activeLobbies.set(interaction.user.id, {
        members: new Set(),
        settings: {
            totalRounds,
            language,
            timeLimit
        },
        points: {},
        answered: new Set()
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
        await i.deferReply({});
        if ((i.customId.startsWith('join_flag_guesser') && i.user.id === hostId) || (i.customId.startsWith('leave_flag_guesser') && i.user.id === hostId)) {
            return i.editReply({ content: 'You are the Host, you can not use this buttons.', flags: 64 });
        }
        
        if ((i.customId.startsWith('close_invite') && i.user.id !== hostId) || (i.customId.startsWith('start_flag_guesser') && i.user.id !== hostId)) {
            return i.editReply({ content: 'You are not the Host, you can not use this buttons.', flags: 64 });
        }
        
        if(i.user.id === hostId) {
            if (i.customId.startsWith('start_flag_guesser')) {
                if (lobby.members.size < 2) {
                    return i.editReply({ content: 'You need at least 2 players to start the game!', flags: 64 });
                } else {
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
                    
                    await i.editReply({ content: 'The game is starting! Check your DMs.', ephemeral: false });
                    const startMessage = await interaction.fetchReply();
                    
                    setTimeout(async () => {
                        console.log('ID:', hostId)
                        try {
                            startMessage.delete().catch(() => {});
                            if (timeLimit) {
                                await playHostRoundWithTime(i, 1, totalRounds, language, timeLimit * 1000, hostId);
                            } else {
                                await playHostRoundWithoutTime(i, 1, totalRounds, language, hostId);
                            }
                        } catch (error) {
                            console.error('Error in Timeout:', error);
                        }
                    }, 10000);
                }
                return;
            } else if (i.customId.startsWith('close_invite')) {
                activeLobbies.delete(hostId);
                await i.message.delete();
                closedByHost = true;
                await i.editReply({ content: 'Invite closed successfully.', flags: 64 });
            } else {
                return i.editReply({ content: 'You are the Host, you can not use this button.', flags: 64 });
            }
        } else {
            if (i.customId.startsWith('join_flag_guesser')) {
                if (!lobby) {
                    return i.editReply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
                }
                
                if (lobby.members.has(i.user.id)) {
                    return i.editReply({ content: 'You have already joined this game!', flags: 64 });
                }
                
                lobby.members.add(i.user.id);
                const updatedEmbed = await createLobbyEmbed(lobby, lobby.settings.language, lobby.settings.totalRounds, lobby.settings.timeLimit, interaction.user.username);
                await interaction.editReply({ embeds: [updatedEmbed], components: [inviteMessageButtons] });
                return i.editReply({ content: 'You have joined the game!', flags: 64 });
            } else if (i.customId.startsWith('leave_flag_guesser')) {
                if (!lobby) {
                    return i.editReply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
                }
                
                if (!lobby.members.has(i.user.id)) {
                    return i.editReply({ content: 'You have not joined this game!', flags: 64 });
                }
                
                lobby.members.delete(i.user.id);
                const updatedEmbed = await createLobbyEmbed(lobby, lobby.settings.language, lobby.settings.totalRounds, lobby.settings.timeLimit, interaction.user.username);
                await interaction.editReply({ embeds: [updatedEmbed], components: [inviteMessageButtons] });
                return i.editReply({ content: 'You have left the game!', flags: 64 });
            } else {
                return i.editReply({ content: 'You are not the Host, you can not use this button.', flags: 64 });
            }
        }
    });
    collector.on('end', async () => {
        try{
            if (closedByHost) {
                activeLobbies.delete(hostId);
                await message.delete();
            }
        } catch (error) {
            console.error('Error closing lobby and deleting message:', error);
        }
    });
    return message;
}

export async function closeHostLobby(interaction, hostId) {
    try {
        const lobby = activeLobbies.get(hostId);
        
        if (lobby) {
            activeLobbies.delete(hostId);
            await interaction.editReply({ content: 'You lobby has been deleted.', flags: 64 });
        } else {
            await interaction.editReply({ content: 'You do not have an active lobby.', flags: 64 });
        }
    } catch (error) {
        console.error('Error closing lobby:', error);
        await interaction.editReply({ content: 'An error occurred while closing your lobby. Try again later.', flags: 64 });
    }
}

export async function playHostRoundWithTime(interaction, roundNumber, totalRounds, language, timeLimitMs, hostId, correctCount = 0) {
    let round;
    const lobby = activeLobbies.get(hostId);
    
    if (!lobby) {
        return interaction.editReply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
    }
    
    if (language) {
        await registerEnglishLocale(language);
        round = generateRoundData(language);
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`Round ${roundNumber}/${totalRounds}`)
        .setDescription('Which country does this flag belong to?')
        .setImage(round.imageUrl);
    const answer = new ActionRowBuilder()
        .addComponents(
            round.options.map(option =>
                new ButtonBuilder()
                    .setCustomId(option)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Primary)
        ));
    
    for (const memberId of lobby.members) {
        try {
            const member = await interaction.guild.members.fetch(memberId);
            const dm = await member.createDM();
            const message = await dm.send({ embeds: [embed], components: [answer] });
            const filter = i => i.user.id === memberId;
            const collector = message.createMessageComponentCollector({ filter, time: timeLimitMs });
            let answered = false;
            
            collector.on('collect', async i => {
                answered = true;
                const isCorrect = i.customId === round.correct;
                
                if (lobby.answered.has(memberId)) return;
                
                if (isCorrect) correctCount++;
                
                if (!lobby.points[memberId]) lobby.points[memberId] = [];
                
                lobby.points[memberId].push(isCorrect);
                lobby.answered.add(memberId);
                
                const resultEmbed = EmbedBuilder.from(embed)
                    .setDescription(isCorrect ? `✅ Correct! The answer is **${round.correct}**.` : `❌ Incorrect! Correct answer: **${round.correct}**.`);
                
                const disabledRow = new ActionRowBuilder()
                    .addComponents(answer.components.map(button => button.setDisabled(true)));
                
                await i.update({ embeds: [resultEmbed], components: [disabledRow] });
                await checkIfRoundFinished(interaction, roundNumber, totalRounds, language, hostId, correctCount);
                
                collector.stop();
            });
            
            collector.on('end', async collected => {
                if (!lobby.answered.has(memberId)) {
                    lobby.points[memberId] = lobby.points[memberId] || [];
                    lobby.points[memberId].push(false);
                    lobby.answered.add(memberId);
                    
                    const resultEmbed = EmbedBuilder.from(embed)
                        .setDescription(`⏰ Time's up! The correct answer was **${round.correct}**.`);
                    
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(answer.components.map(button => button.setDisabled(true)));
                    
                    await message.edit({ embeds: [resultEmbed], components: [disabledRow] });
                    await checkIfRoundFinished(interaction, roundNumber, totalRounds, language, hostId, correctCount);
                }
            });
        } catch (error) {
            console.warn(`Could not send DM to user ${memberId}:`, error);
        }
    }
}

export async function playHostRoundWithoutTime(interaction, roundNumber, totalRounds, language, hostId, correctCount = 0) {
    let round;
    const lobby = activeLobbies.get(hostId);
    
    if (!lobby) {
        return interaction.editReply({ content: 'This game lobby does not exist or has already been closed.', flags: 64 });
    }
    
    if (language) {
        await registerEnglishLocale(language);
        round = generateRoundData(language);
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`Round ${roundNumber}/${totalRounds}`)
        .setDescription('Which country does this flag belong to?')
        .setImage(round.imageUrl);
    const answer = new ActionRowBuilder()
        .addComponents(
            round.options.map(option =>
                new ButtonBuilder()
                    .setCustomId(option)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Primary)
        ));
    
    for (const memberId of lobby.members) {
        try {
            const member = await interaction.guild.members.fetch(memberId);
            const dm = await member.createDM();
            const message = await dm.send({ embeds: [embed], components: [answer] });
            const filter = i => i.user.id === memberId;
            const collector = message.createMessageComponentCollector({ filter });
            let answered = false;
            
            collector.on('collect', async i => {
                answered = true;
                const isCorrect = i.customId === round.correct;
                
                if (lobby.answered.has(memberId)) return;
                
                if (isCorrect) correctCount++;
                
                if (!lobby.points[memberId]) lobby.points[memberId] = [];
                
                lobby.points[memberId].push(isCorrect);
                lobby.answered.add(memberId);
                
                console.log(lobby.points, lobby.answered);
                
                const resultEmbed = EmbedBuilder.from(embed)
                    .setDescription(isCorrect ? `✅ Correct! The answer is **${round.correct}**.` : `❌ Incorrect! Correct answer: **${round.correct}**.`);
                
                const disabledRow = new ActionRowBuilder()
                    .addComponents(answer.components.map(button => button.setDisabled(true)));
                
                await i.update({ embeds: [resultEmbed], components: [disabledRow] });
                await checkIfRoundFinished(interaction, roundNumber, totalRounds, language, hostId, correctCount)
                
                collector.stop();
            });
            
            collector.on('end', async collected => {
                if (!lobby.answered.has(memberId)) {
                    lobby.points[memberId] = lobby.points[memberId] || [];
                    lobby.points[memberId].push(false);
                    lobby.answered.add(memberId);
                    
                    const resultEmbed = EmbedBuilder.from(embed)
                        .setDescription(`⏰ Time's up! The correct answer was **${round.correct}**.`);
                    
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(answer.components.map(button => button.setDisabled(true)));
                    
                    await message.edit({ embeds: [resultEmbed], components: [disabledRow] });
                    await checkIfRoundFinished(interaction, roundNumber, totalRounds, language, hostId, correctCount);
                }
            });
        } catch (error) {
            console.warn(`Could not send DM to user ${memberId}:`, error);
        }
    }
}
async function checkIfRoundFinished(interaction, roundNumber, totalRounds, language, hostId, correctCount) {
    const lobby = activeLobbies.get(hostId);
    const guildId = process.env.GUILD_ID;
    
    if (lobby.answered.size === lobby.members.size) {
        setTimeout(async () => {
            lobby.answered.clear();
            
            if (roundNumber < totalRounds) {
                await playHostRoundWithoutTime(interaction, roundNumber + 1, totalRounds, language, hostId, correctCount);
            } else {
                const guild = await interaction.client.guilds.fetch(guildId);
                let bestCorrectAnswerCount = 0;
                let bestPlayer = '';
                
                // Check for the best player of the lobby
                for (const memberId of lobby.members) {
                    const answers = lobby.points[memberId] || [];
                    let correctAnswersCount = 0;
                    
                    for (const answer of answers) {
                        if (answer) correctAnswersCount++;
                    }
                    
                    if (correctAnswersCount > bestCorrectAnswerCount) {
                        bestCorrectAnswerCount = correctAnswersCount;
                        bestPlayer = memberId;
                    }
                }
                
                // Check if the best player in the guild to fetch his username
                if (guild.members.fetch(bestPlayer)) {
                    const bestPlayerMember = await guild.members.fetch(bestPlayer);
                    bestPlayer = bestPlayerMember.user.username;
                } else {
                    bestPlayer = 'Unknown';
                }
                
                // Count the correct answers of every member
                for (const memberId of lobby.members) {
                    const answers = lobby.points[memberId] || [];
                    let correctAnswersCount = 0;
                    
                    for (const answer of answers) {
                        if (answer) correctAnswersCount++;
                    }
                    
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('🏁 Game Over!')
                        .setDescription(`You got ${correctAnswersCount} out of ${answers.length} correct.\nThe best player of the lobby was ${bestPlayer} with ${bestCorrectAnswerCount}.`)
                        .setColor('#ff0000');
                    
                    try {
                        const member = await interaction.guild.members.fetch(memberId);
                        const dm = await member.createDM();
                        await dm.send({ embeds: [finalEmbed] });
                    } catch (error) {
                        console.warn(`Could not send final DM to user ${memberId}:`, error);
                    }
                }
            }
        }, 5000);
    }
}