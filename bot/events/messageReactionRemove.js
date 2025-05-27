import { Events } from 'discord.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const name = Events.MessageReactionRemove;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function execute(reaction, user) {
	try {
		const metaPath = path.join(__dirname, '../meta.json');
        const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
		const ruleMessage = meta.message.rule;
		const validRuleReaction = '✅';
		const memberRoleId = meta.role.member;

		if (user.bot) return;

		if (reaction.partial) await reaction.fetch();
		if (reaction.message.partial) await reaction.message.fetch();

		if (!ruleMessage.includes(reaction.message.id)) return;
		if (reaction.emoji.name !== validRuleReaction) return;

		const member = await reaction.message.guild.members.fetch(user.id);
		const role = reaction.message.guild.roles.cache.get(memberRoleId);

		if (!member || !role) return;

		if (member.roles.cache.has(role.id)) {
			await member.roles.remove(role);
		}
	} catch (error) {
		console.error('Error in reaction handler:', error);
	}
}