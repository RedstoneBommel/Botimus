import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { fetchColorData } from '../utils/fetchData.js';

let colorChoices;

try {
    colorChoices = await fetchColorData();
} catch (error) {
    console.error('Error while loading the color data:', error);
}

export const data = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Handel any role on the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(command =>
        command.setName('add')
            .setDescription('Add a new role to this guild.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Select a role name for your new role.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('color')
                    .setDescription('Select a color for your new role.')
                    .setRequired(true)
                    .addChoices(...colorChoices)
            )
            .addStringOption(option =>
                option.setName('preset')
                    .setDescription('Select a permission template.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Moderator', value: 'mod' },
                        { name: 'Member', value: 'user' },
                        { name: 'custom', value: 'custom' }
                    )
            )
    )
    .addSubcommand(command =>
        command.setName('delete')
            .setDescription('Delete any role from this guild')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Select a role to delete from this guild.')
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const rolePermissionFlags = {
        mod: [
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageNicknames,
            PermissionFlagsBits.MuteMembers
        ],
        user: [
            PermissionFlagsBits.SendMessages
        ],
        custom: []
    };
    const command = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const name = interaction.options.getString('name');
    const color = interaction.options.getString('color');
    const preset = interaction.options.getString('preset');
    const permissions = rolePermissionFlags[preset];
    const role = interaction.options.getRole('role');
    
    await interaction.deferReply({ flags: 64 });
    
    if (!guild) {
        return await interaction.editReply({ content: 'This command only works in guilds.' });
    }
    
    if (command === 'add') {
        if (name.length > 30) {
            return await interaction.editReply({ content: 'Selected role name is to long, try something shorter.' });
        }
        
        if (!validHexCode(color)) {
            return await interaction.editReply({ content: 'Selected color is not a valid hex code, try another.' });
        }
        
        const cleanColor = color.startsWith('#') ? color.slice(1) : color;
        let roleData = {
            name,
            color: cleanColor
        }
        
        if (permissions.length > 0) {
            roleData.permissions = permissions
        };
        
        await guild.roles.create(roleData);
        return await interaction.editReply({ content: `${name} role created in ${guild.name} successfully.` });
        
    } else if (command === 'delete') {
        const roleFetch = await guild.roles.fetch(role.id);
        
        if (roleFetch) {
            try {
                const roleName = roleFetch.name;
                await roleFetch.delete();
                
                return await interaction.editReply({ content: `${roleName} role deleted from ${guild.name} successfully.` });
            } catch (error) {
                console.error('Role deleting error:', error);
                return await interaction.editReply({ content: ' Something went wrong while deleting the role.' });
            }
        } else {
            return await interaction.editReply({ content: 'Role not found.' });
        }
    } else {
        return await interaction.editReply({ content: 'Unknown subcommand used.' });
    }
}

function validHexCode(input) {
    return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(input);
}