import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { startWebSocketClient } from './utils/webSocketClient.js';

dotenv.config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildPresences
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
		Partials.User,
		Partials.GuildMember
	]
});
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadCommands = async () => {
	const foldersPath = path.join(__dirname, 'commands');
	const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(foldersPath, file);
		const command = await import(pathToFileURL(filePath).href);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

};

const loadEvents = async () => {
	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = await import(pathToFileURL(filePath).href);

		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
};

const main = async () => {
	await loadCommands();
	await loadEvents();
	startWebSocketClient();
	client.login(process.env.BOT_TOKEN);
};

main();
