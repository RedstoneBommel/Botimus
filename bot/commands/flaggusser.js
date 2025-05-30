import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { translate } from 'google-translate-api-browser';
import ISO6391 from 'iso-639-1';
import { playRoundWithTime, playRoundWithoutTime } from '../utils/flagGuesser.js';

export const data = new SlashCommandBuilder()
    .setName('flaggusser')
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
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const time = interaction.options.getString('time');
    const rounds = interaction.options.getString('rounds') || '10';
    const userId = interaction.user.id;
    let language = interaction.options.getString('language');
    
    await interaction.deferReply({ ephemeral: true });
    
    switch (subcommand) {
        case 'start':
            const roundsInt = parseInt(rounds, 10) || 10;
            
            if (language) {
                if (!ISO6391.validate(language)) {
                    const translatedLanguage = await translate(language, { to: 'en' });
                    const languageCode = ISO6391.getCode(translatedLanguage.text.toLowerCase());
                    if (languageCode) {
                        language = languageCode;
                    } else {
                        return interaction.editReply({ content: 'Invalid language name or code. Please use a valid ISO 639-1 code or name.', flags: MessageFlags.Ephemeral });
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
                bestScore: 0
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
                await interaction.editReply({ content: 'No scores available yet.', ephemeral: true });
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
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Flag Guesser Scoreboard')
                .setDescription('Top 5 players in the flag guessing game:')
                .addFields(fields)
                .setTimestamp()
                .setFooter({
                    text: `Last Score: ${userScores > 0 ? userScores.lastScore : null}, Best Score: ${userScores.bestScore > 0 ? userScores.bestScore : null}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
            
            await interaction.editReply({ embeds: [embed] });
            break;
        case 'help':
            break;
        case 'host':
            break;
        default:
            await interaction.editReply({ content: 'Unknown subcommand.', ephemeral: true });
            return;
    }
}