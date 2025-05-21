import axios from "axios";
import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import dotenv from 'dotenv';

dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Let the bot congratulate you on your birthday')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command =>
        command.setName('create')
            .setDescription('Store your own birthday')
            .addStringOption(option =>
                option.setName('date')
                    .setDescription('Please enter your birthday in this format: YYYY-MM-DD')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('public')
                    .setDescription('Decide whether this message should be public or private')
                    .setRequired(true)
            )
    )
    .addSubcommand(command =>
        command.setName('delete')
            .setDescription('Remove your birthday (Botimus will no longer congratulate you)')
    )
    .addSubcommand(command =>
        command.setName('next')
            .setDescription('Get an overview of the next five public birthdays')
    )

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    
    await interaction.deferReply({ ephemeral: true });
    
    if (!interaction.guild) {
        return interaction.editReply({ content: 'This command can only be used in servers.' });
    }
    
    switch (subCommand) {
        case 'create':
            const date = new Date(interaction.options.getString('date'));
            const global = interaction.options.getBoolean('public');
            
            if (isNaN(date.getTime())) {
                return interaction.editReply({ content: 'Invalid date! Please enter your birthday in this format: YYYY-MM-DD' });
            } else {
                try {
                    const response = await axios.post(`${process.env.BACKEND_URL}/birthday/create`, {
                        userId,
                        date,
                        global
                    });
                    
                    if (response.status === 200) {
                        return interaction.editReply({ content: 'Birthday stored successfully!' });
                    } else {
                        return interaction.editReply({ content: 'Unexpected server response. Try again later.' });
                    }
                } catch (error) {
                    console.error(error);
                    return interaction.editReply({ content: 'Error while storing your birthday. Try again later. If this error persists, please contact support.' });
                }
            }
        case 'delete':
            try {
                const response = await axios.post(`${process.env.BACKEND_URL}/birthday/delete`, {
                    userId
                });
                
                if (response.status === 200) {
                    return interaction.editReply({ content: 'Birthday deleted successfully!' });
                } else {
                    return interaction.editReply({ content: 'Unexpected server response. Try again later.' });
                }
            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'Error while deleting your birthday. Try again later. If this error persists, please contact support.' });
            }
        case 'next':
            let embed;
            try {
                const response = await axios.get(`${process.env.BACKEND_URL}/birthday/next`);
                
                if (response.status === 200) {
                    const serverName = interaction.guild.name;
                    const data = response.data;
                    const fields = await Promise.all(data.map(async (entry) => {
                        const date = new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
                        
                        try {
                            const user =  await interaction.guild.members.fetch(entry.userId);
                            return {
                                name: `${date} - ${user.displayName}`,
                                value: '\u200B'
                            };
                        } catch (error) {
                            console.warn(`User ${entry.userId} not found in this guild.`);
                            return {
                                name: `${date} – Unknown User`,
                                value: '\u200B'
                            };
                        }
                    }));
                    
                    embed = new EmbedBuilder()
                        .setColor('#eec93d')
                        .setTitle(`The next 5 birthdays at ${serverName}`)
                        .addFields(fields);
                    return interaction.editReply({ embeds: [embed] });
                } else {
                    return interaction.editReply({ content: 'Unexpected server response. Try again later.' });
                }
            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'Error while generating next birthdays list. Try again later. If this error persists, please contact support.' });
            }
        default:
            return interaction.editReply({ content: 'Unknown subcommand used.' });
    }
}