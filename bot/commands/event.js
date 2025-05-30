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
                option.setName('date_start')
                    .setDescription('The date of the event (YYYY-MM-DD).')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('time_start')
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
            .addStringOption(option =>
                option.setName('address')
                    .setDescription('The address of the event.')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('date_end')
                    .setDescription('The end date of the event (YYYY-MM-DD).')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('time_end')
                    .setDescription('The end time of the event (HH:MM:SS).')
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
                const dateStart = interaction.options.getString('date_start');
                const timeStart = interaction.options.getString('time_start');
                const location = interaction.options.getString('location');
                const voiceChannel = interaction.options.getChannel('voice_channel');
                const address = interaction.options.getString('address') || 'No address provided';
                const dateEnd = interaction.options.getString('date_end');
                const timeEnd = interaction.options.getString('time_end');
                
                if (!interaction.guild) {
                    return interaction.editReply('This command can only be used in a server.');
                }
                
                if (location === '2' && !voiceChannel) {
                    return interaction.editReply('Please specify a voice channel for online events.');
                } else if (location === '3' && (dateEnd === null && timeEnd === null)) {
                    return interaction.editReply('Please enter a end date and end time for your event (just required with "In-Person"-Events).');
                }
                
                const isoTimestampStart = new Date(`${dateStart}T${timeStart}`);
                if (isNaN(isoTimestampStart.getTime())) {
                    return interaction.editReply('Please provide valid date and time.');
                }
                
                const isoTimestampEnd = new Date(`${dateEnd}T${timeEnd}`);
                if(isNaN(isoTimestampEnd.getTime())) {
                    return interaction.editReply('Please provide a valid end date and time.');
                }
                
                const eventSettings = {
                    name: name,
                    description: description,
                    scheduledStartTime: new Date(`${dateStart}T${timeStart}Z`),
                    entityType: parseInt(location, 10),
                    privacyLevel: 2 // Guild Only
                }
                
                if (location === '2') {
                    Object.assign(eventSettings, {
                        channel: voiceChannel.id
                    });
                } else if (location === '3') {
                    Object.assign(eventSettings, {
                        scheduledEndTime: new Date(`${dateEnd}T${timeEnd}Z`),
                        entityMetadata: {
                            location: address
                        }
                    });
                }
                
                try {
                    await interaction.guild.scheduledEvents.create(eventSettings);
                    await interaction.editReply(`Event created: **${name}** on **${dateStart}** at **${timeStart}**.`);
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