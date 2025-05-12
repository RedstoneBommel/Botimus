import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { translate } from 'google-translate-api-browser';
import ISO6391 from 'iso-639-1';

export const data = new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate your own messages into any language')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand(command =>
        command.setName('global')
            .setDescription('Send your translated message to the global chat.')
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('Enter the language you want your message to be translated into.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('Add your message you like to translate here.')
                    .setRequired(true)
            )
    )
    .addSubcommand(command =>
        command.setName('private')
            .setDescription('Send with private-mode (only you and the bot will see the translated content)')
            .addStringOption(option =>
                option.setName('language')
                    .setDescription('Enter the language you want your message to be translated into.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('Add your message you like to translate here.')
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    let language = interaction.options.getString('language');
    const message = interaction.options.getString('message');

    await interaction.deferReply({ ephemeral: subCommand === 'private' });

    if (!ISO6391.validate(language)) {
        const translatedLanguage = await translate(language, { to: 'en' });
        const languageCode = ISO6391.getCode(translatedLanguage.text.toLowerCase());
        if (languageCode) {
            language = languageCode;
        } else {
            return interaction.editReply({ content: 'Invalid language name or code. Please use a valid ISO 639-1 code or name.', flags: MessageFlags.Ephemeral });
        }
    }

    try {
        const translatedText = await translate(message, { to: language });
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Translation')
            .addFields(
                { name: 'Original Message', value: message },
                { name: 'Translated Message', value: translatedText.text }
            );

        if (subCommand === 'global') {
            await interaction.editReply(translatedText.text);
        } else {
            await interaction.user.send({ embeds: [embed] });
            await interaction.editReply({ content: 'Your translated message has been sent to your DMs!', flags: MessageFlags.Ephemeral });
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
};
