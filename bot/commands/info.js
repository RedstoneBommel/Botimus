import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get information about users and server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command =>
        command.setName("user")
            .setDescription("Get information about a user.")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The user to get information about.")
                    .setRequired(true)
            )
    )
    .addSubcommand(command =>
        command.setName("server")
            .setDescription("Get information about the server.")
    );

export async function execute(interaction) {
    if (interaction.options.getSubcommand() === "user") {
        const user = interaction.options.getUser("user");
        const member = await interaction.guild.members.fetch(user.id);
        
        const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => r.toString())
            .join(", ") || "No roles";
        
        const embed = new EmbedBuilder()
            .setColor("#00b0f4")
            .setTitle(`📄 Member Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "🧑 Username", value: `${user.tag}`, inline: true },
                { name: "🆔 User ID", value: `${user.id}`, inline: true },
                { name: "🎂 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
                { name: "📥 Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: "🏷️ Roles", value: roles, inline: false },
                { name: "💬 Status", value: `${member.presence?.status ?? "Offline"}`, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    
    } else if (interaction.options.getSubcommand() === "server") {
        const guild = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setColor("#00b0f4")
            .setTitle(`🌐 Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: "📛 Servername", value: guild.name, inline: true },
                { name: "🆔 Server ID", value: guild.id, inline: true },
                { name: "👥 Member Count", value: `${guild.memberCount}`, inline: true },
                { name: "🕰️ Created at", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
                { name: "🔗 Invitation", value: 'https://discord.gg/FNFmENdxP7', inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
}
