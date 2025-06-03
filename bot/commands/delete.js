import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete messages or roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(command =>
        command.setName('messages')
            .setDescription('Delete messages from any member in the current channel.')
            .addStringOption(option =>
                option.setName('count')
                    .setDescription('Select how much messages should be deleted (Between 1 and 100).')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('member')
                    .setDescription('Select which messages should be deleted.')
                    .setRequired(false)
            )
    )
    .addSubcommand(command =>
        command.setName('role')
            .setDescription('Delete any role from this guild.')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Select a role to delete from the guild.')
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const command = interaction.options.getSubcommand();
    const count = interaction.options.getString('count');
    const member = interaction.options.getMember('member');
    const role = interaction.options.getRole('role');
    const guild = interaction.guild;
    let countInt;
    
    await interaction.deferReply({ flags: 64 });
    
    if (isNaN(parseInt(count, 10)) || parseInt(count, 10) < 0 || parseInt(count, 10) > 100) {
        return await interaction.editReply({ content: 'Please enter a valid integer (between 1 and 1000).'});
    } else {
        countInt = parseInt(count, 10);
    }
    
    if (!guild) {
        return await interaction.editReply({ content: 'This command only works in guilds.' });
    }
    
    if (command === 'messages') {
        if (countInt === 0) {
            countInt = 10;
        }
        
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let toDelete;
            let deleted = 0;
            
            if (member) {
                toDelete = messages.filter(message => message.author.id === member.id).first(countInt);
            } else {
                toDelete = messages.first(countInt);
            }
            
            if (!toDelete || toDelete.length === 0) {
                return await interaction.editReply({ content: 'No messages found.' });
            }
            
            for (const message of toDelete) {
                try {
                    await message.delete();
                    deleted++;
                } catch (error) {
                    console.error('Message deleting error:', error);
                    return await interaction.editReply({ content: 'Something went wrong while deleting the messages' });
                }
            }
            
            return await interaction.editReply ({ content: `${deleted} messages${member ? ' from ' + member.user.username : ''} have been deleted successfully in the current channel.` });
        } catch (error) {
            console.error('Message deleting error:', error);
            return await interaction.editReply({ content: 'Something went wrong while deleting the messages.' });
        }
    } else if (command === 'role') {
        const roleFetch = await guild.roles.fetch(role.id);
        
        if (roleFetch) {
            try {
                const roleName = roleFetch.name;
                await roleFetch.delete();
                
                return await interaction.editReply({ content: `${roleName} role deleted from ${guild.name} successfully.` });
            } catch (error) {
                console.error('Role deleting error:', error);
                return await interaction.editReply({ content: 'Something went wrong while deleting the role.' });
            }
        } else {
            return await interaction.editReply({ content: 'Role not found.' });
        }
    } else {
        return await interaction.editReply({ content: 'Unknown subcommand used.' });
    }
}