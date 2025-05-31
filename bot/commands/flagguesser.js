import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { translate } from 'google-translate-api-browser';
import ISO6391 from 'iso-639-1';
import { closeHostLobby, generateInviteEmbed } from '../utils/flagGuesserHost.js';
import { playRoundWithTime, playRoundWithoutTime } from '../utils/flagGuesserSolo.js';

export const data = new SlashCommandBuilder()
    .setName('flagguesser')
    .setDescription('Play a little flag guessing game. And battle your friends!')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(subcommand =>
        subcommand.setName('start')
            .setDescription('Start a flag guessing game.')
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('Time limit for each question in seconds.')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('rounds')
                    .setDescription('Number of rounds in the game.')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('Language for the game.')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('scoreboard')
            .setDescription('View the scoreboard for the flag guessing game.')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('help')
            .setDescription('Get help for the flag guessing game.')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('host')
            .setDescription('Host a flag guessing game.')
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('Time limit for each question in seconds.')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('rounds')
                    .setDescription('Number of rounds in the game.')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('Language for the game.')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('close')
            .setDescription('Close your active lobby')
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const time = interaction.options.getString('time');
    const rounds = interaction.options.getString('rounds') || '10';
    const userId = interaction.user.id;
    let language = interaction.options.getString('language');
        
    switch (subcommand) {
        case 'start':
            await interaction.deferReply({ flags: 64 });
            
            const roundsInt = parseInt(rounds, 10) || 10;
            
            if (language) {
                if (!ISO6391.validate(language)) {
                    try {
                        const translated = await translate(language, { to: 'en' });
                        const code = ISO6391.getCode(translated.text.toLowerCase());
                        if (code) {
                            language = code;
                        } else {
                            return interaction.editReply({
                                content: 'Invalid language name or code. Please use a valid ISO 639-1 code or name.',
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    } catch (err) {
                        console.error('Translation error:', err);
                        return interaction.editReply({
                            content: 'Error translating the language. Please try again.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            } else {
                language = 'en';
            }
            
            if (roundsInt <= 0) {
                await interaction.editReply('Invalid number of rounds. Please provide a positive integer.');
                return;
            }
            
            if (!time) {
                await interaction.editReply('🎮 Starting flag guessing game...');
                await playRoundWithoutTime(interaction, 1, roundsInt, language);
            } else {
                const timeInt = parseInt(time, 10);
                const timeLimitMs = isNaN(timeInt) || timeInt <= 0 ? undefined : timeInt * 1000;
                
                if (!timeLimitMs) {
                    await interaction.editReply('Invalid time limit. Please provide a positive number in seconds.');
                    return;
                }
                
                await interaction.editReply('🎮 Starting flag guessing game...');
                await playRoundWithTime(interaction, 1, roundsInt, language, timeLimitMs);
            }
            break;
        case 'scoreboard':
            let allScores = [];
            let scoreboard = [];
            let userScores = {
                lastScore: 0,
                totalScore: 0
            };
            let fields;
            
            // Fetch full scoreboard from backend
            
            // Fetch interaction user scores
            
            for (let i = 0; i < 5; i++) {
                const score = allScores[i];
                const user = await interaction.client.users.fetch(score.userId).catch(() => null);
                
                if (user) {
                    scoreboard.push({
                        username: user.username,
                        score: score.score,
                    });
                } else {
                    scoreboard.push({
                        username: 'Unknown User',
                        score: score.score,
                    });
                }
            }
            
            if (scoreboard.length === 0) {
                await interaction.editReply({ content: 'No scores available yet.', flags: 64 });
                return;
            }
            
            // Store user scores in userScores object
            
            fields = await Promise.all(scoreboard.map(async (entry, index) => {
                return {
                    name: `${index +1}. ${entry.username}`,
                    value: `Score: ${entry.score}`,
                    inline: true
                }
            }));
            
            const embedScore = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Flag Guesser Scoreboard')
                .setDescription('Top 5 players in the flag guessing game:')
                .addFields(fields)
                .setTimestamp()
                .setFooter({
                    text: `Last Score: ${userScores > 0 ? userScores.lastScore : null}, Best Score: ${userScores.totalScore > 0 ? userScores.totalScore : null}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
            
            await interaction.editReply({ embeds: [embedScore], flags: 64 });
            break;
        case 'help':
            await interaction.deferReply({ flags: 64 });
            
            const embedHelp = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🌍 Flag Guesser – Help')
                .setDescription('Welcome to **Flag Guesser**! 🧠🌐\nTest your knowledge of the world\'s flags — solo or with friends.')
                .addFields(
                    {
                        name: '📖 Introduction',
                        value:
                            'In *Flag Guesser*, you\'ll be shown random flags from around the world, and your task is to guess the correct country.\n' +
                            'You can play solo or host a multiplayer game with friends.\n' +
                            'All named options are optional, and the game will use defaults if not specified. More details below.'
                    },
                    {
                        name: '🎮 Commands',
                        value: 'Here are all available slash commands and their options:',
                    },
                    {
                        name: '🚩 `/flagguesser start`',
                        value:
                            'Start a new solo game.\n' +
                            '**Options:**\n' +
                            '• `time` – Set the time limit per round (default: unlimited)\n' +
                            '• `rounds` – Set how many rounds to play (default: 10)\n' +
                            '• `language` – Choose the answer language (`english`, `deutsch`) (default: `english`)',
                    },
                    {
                        name: '🏆 `/flagguesser scoreboard`',
                        value:
                            'View the top 5 players by total score.\n' +
                            'The scoreboard updates after every game and tracks cumulative points.',
                    },
                    {
                        name: '❓ `/flagguesser help`',
                        value:
                            'Displays this help message.\n' +
                            'Useful if you need instructions or a refresher on the commands.',
                    },
                    {
                        name: '👥 `/flagguesser host`',
                        value:
                            'Host a multiplayer game with friends.\n' +
                            '**Options:**\n' +
                            '• `time` – Set the time limit per round for all players (default: unlimited)\n' +
                            '• `rounds` – Set how many rounds the lobby will play (default: 10)\n' +
                            '• `language` – Choose the answer language for the whole lobby (`english`, `deutsch`) (default: `english`)',
                    },
                    {
                        name: '❌ `/flagguesser close`',
                        value:
                            'Close your active lobby via command.\n' +
                            'Use this if the original lobby message is missing or the lobby has crashed.'
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: '🌟 Have fun guessing flags!',
                });
            
            await interaction.editReply({ embeds: [embedHelp], flags: 64 });
            break;
        case 'host':
            await interaction.deferReply({});
            await interaction.fetchReply();
            
            const hostRoundsInt = parseInt(rounds, 10) || 10;
            
            if (language) {
                if (!ISO6391.validate(language)) {
                    try {
                        const translated = await translate(language, { to: 'en' });
                        const code = ISO6391.getCode(translated.text.toLowerCase());
                        if (code) {
                            language = code;
                        } else {
                            return interaction.editReply({
                                content: 'Invalid language name or code. Please use a valid ISO 639-1 code or name.',
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    } catch (err) {
                        console.error('Translation error:', err);
                        return interaction.editReply({
                            content: 'Error translating the language. Please try again.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            } else {
                language = 'en';
            }
            
            if (hostRoundsInt <= 0) {
                await interaction.editReply('Invalid number of rounds. Please provide a positive integer.');
                return;
            }
            
            await interaction.editReply('🎮 Hosting flag guessing game...');
            await generateInviteEmbed(interaction, hostRoundsInt, language, time ? parseInt(time, 10) : null, userId);
            break;
        case 'close':
            await interaction.deferReply({});
            await closeHostLobby(interaction, userId);
            break;
        default:
            await interaction.editReply({ content: 'Unknown subcommand.', flags: 64 });
            return;
    }
}