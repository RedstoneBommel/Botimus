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

export async function playRoundWithTime(interaction, roundNumber, totalRounds, language, timeLimitMs, correctCount = 0) {
    let round;
    
    if (language) {
        await registerEnglishLocale(language);
        round = generateRoundData(language);
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`Round ${roundNumber}/${totalRounds}`)
        .setDescription('Which country does this flag belong to?')
        .setImage(round.imageUrl);
    
    const answer = new ActionRowBuilder()
        .addComponents(round.options.map(option =>
            new ButtonBuilder()
                .setCustomId(option)
                .setLabel(option)
                .setStyle(ButtonStyle.Primary)
        ));
    
    await interaction.editReply({ embeds: [embed], components: [answer] });
    const message = await interaction.fetchReply();
    
    const filter = i => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: timeLimitMs });
    
    let answered = false;
    
    collector.on('collect', async i => {
        answered = true;
        const isCorrect = i.customId === round.correct;
        
        if (isCorrect) correctCount++;
        
        const resultEmbed = EmbedBuilder.from(embed)
            .setDescription(`You chose **${i.customId}**.\nThat is **${isCorrect ? 'correct ✅' : 'wrong ❌'}**! Correct answer: **${round.correct}**.`);
        
        const disabledRow = new ActionRowBuilder()
            .addComponents(answer.components.map(button => button.setDisabled(true)));
        
        await i.update({ embeds: [resultEmbed], components: [disabledRow] });
        
        collector.stop();
    });
    
    collector.on('end', async collected => {
        if (!answered) {
            const resultEmbed = EmbedBuilder.from(embed)
                .setDescription(`⏰ Time's up! The correct answer was **${round.correct}**.`);
            
            const disabledRow = new ActionRowBuilder()
                .addComponents(answer.components.map(button => button.setDisabled(true)));
            
            await interaction.editReply({ embeds: [resultEmbed], components: [disabledRow] });
        }
        
        if (roundNumber < totalRounds) {
            setTimeout(() => {
                playRoundWithTime(interaction, roundNumber + 1, totalRounds, language, timeLimitMs, correctCount);
            }, 3000);
        } else {
            await interaction.followUp({ content: `🏁 Game over! You got ${correctCount} out of ${totalRounds} correct.`, flags: 64 });
        }
    });
}

export async function playRoundWithoutTime(interaction, roundNumber, totalRounds, language, correctCount = 0) {
    let round;
    
    if (language) {
        await registerEnglishLocale(language);
        round = generateRoundData(language);
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`Round ${roundNumber}/${totalRounds}`)
        .setDescription('Which country does this flag belong to?')
        .setImage(round.imageUrl);
    
    const answer = new ActionRowBuilder()
        .addComponents(round.options.map(option =>
            new ButtonBuilder()
                .setCustomId(option)
                .setLabel(option)
                .setStyle(ButtonStyle.Primary)
        ));
    
    await interaction.editReply({ embeds: [embed], components: [answer] });
    const message = await interaction.fetchReply();
    
    const filter = i => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter });
    
    let answered = false;
    
    collector.on('collect', async i => {
        answered = true;
        const isCorrect = i.customId === round.correct;
        
        if (isCorrect) correctCount++;
        
        const resultEmbed = EmbedBuilder.from(embed)
            .setDescription(`You chose **${i.customId}**.\nThat is **${isCorrect ? 'correct ✅' : 'wrong ❌'}**! Correct answer: **${round.correct}**.`);
        
        const disabledRow = new ActionRowBuilder()
            .addComponents(answer.components.map(button => button.setDisabled(true)));
        
        await i.update({ embeds: [resultEmbed], components: [disabledRow] });
        
        collector.stop();
    });
    
    collector.on('end', async collected => {
        if (!answered) {
            const resultEmbed = EmbedBuilder.from(embed)
                .setDescription(`⏰ You didn't answer in time! The correct answer was **${round.correct}**.`);
            
            const disabledRow = new ActionRowBuilder()
                .addComponents(answer.components.map(button => button.setDisabled(true)));
            
            await interaction.editReply({ embeds: [resultEmbed], components: [disabledRow] });
        }
        
        if (roundNumber < totalRounds) {
            setTimeout(() => {
                playRoundWithoutTime(interaction, roundNumber + 1, totalRounds, language, correctCount);
            }, 3000);
        } else {
            await interaction.followUp({ content: `🏁 Game over! You got ${correctCount} out of ${totalRounds} correct.`, flags: 64 });
        }
    });
}