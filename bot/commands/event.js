import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage events in the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command =>
        command.setName('create')
            .setDescription('Create a new event.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name of the event.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('A brief description of the event.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('date')
                    .setDescription('The date of the event (YYYY-MM-DD).')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('The time of the event (HH:MM:SS).')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('location')
                    .setDescription('The location of the event.')
                    .addChoices(
                        { name: 'Online', value: '2' }, // Voice
                        { name: 'In-Person', value: '3' } // External
                    )
                    .setRequired(true)
            )
            .addChannelOption(option =>
                option.setName('voice_channel')
                    .setDescription('The voice channel where the event will be announced.')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false)
            )
    )
    .addSubcommand(command =>
        command.setName('list')
            .setDescription('List all events.')
    )
    .addSubcommand(command =>
        command.setName('delete')
            .setDescription('Delete an event.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name of the event to delete.')
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const name = interaction.options.getString('name');
    const adminOnly = ['create', 'delete'];
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.KickMembers);
    
    await interaction.deferReply({ ephemeral: true });
    
    if (adminOnly.includes(subcommand) && !isAdmin) {
        return interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });
    } else {
        switch (subcommand) {
            case 'create':
                const description = interaction.options.getString('description');
                const date = interaction.options.getString('date');
                const time = interaction.options.getString('time');
                const location = interaction.options.getString('location');
                const voiceChannel = interaction.options.getChannel('voice_channel');
                
                if (!interaction.guild) {
                    return interaction.editReply('This command can only be used in a server.');
                }
                
                const isoTimestamp = new Date(`${date}T${time}`);
                if (isNaN(isoTimestamp.getTime())) {
                    return interaction.editReply('Please provide valid date and time.');
                }
                
                if (location === '2' && !voiceChannel) {
                    return interaction.editReply('Please specify a voice channel for online events.');
                }
                
                try {
                    await interaction.guild.scheduledEvents.create({
                        name: name,
                        description: description,
                        scheduledStartTime: new Date(`${date}T${time}Z`),
                        entityType: parseInt(location, 10),
                        channel: voiceChannel.id ?? null,
                        privacyLevel: 2 // Guild Only
                    });
                    
                    await interaction.editReply(`Event created: **${name}** on **${date}** at **${time}**.`);
                } catch (error) {
                    console.error('Error creating event:', error);
                    return interaction.editReply('An error occurred while creating the event. Please try again later.');
                }
                
                // Storing at backend
                
                break;
            case 'list':
                
                // Fetch from Backend
                
                await interaction.editReply('Listing all events: (This is a placeholder response)'); // Replace message with embed
                break;
            case 'delete':
                const eventList = await interaction.guild.scheduledEvents.fetch();
                const eventToDelete = eventList.find(event => event.name === name);
                
                if (!eventToDelete) {
                    return interaction.editReply(`No event found with the name **${name}**.`);
                }
                
                try {
                    await eventToDelete.delete();
                    await interaction.editReply(`Event **${name}** has been deleted.`);
                } catch (error) {
                    console.error('Error deleting event:', error);
                    return interaction.editReply('An error occurred while deleting the event. Please try again later.');
                }
                
                // Remove from backend
                
                break;
            default:
                await interaction.editReply('Unknown subcommand.');
        }
    }
}