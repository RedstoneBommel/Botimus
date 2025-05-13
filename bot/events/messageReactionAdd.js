import { Events } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config()

export const name = Events.MessageReactionRemove;

export async function execute(reaction, user) {
	try {
		const ruleMessage = process.env.RULE_MESSAGE;
		const validRuleReaction = '✅';
		const memberRoleId = process.env.MEMBER_ROLE_ID;

		if (user.bot) return;

		if (reaction.partial) await reaction.fetch();
		if (reaction.message.partial) await reaction.message.fetch();

		if (!ruleMessage.includes(reaction.message.id)) return;
		if (reaction.emoji.name !== validRuleReaction) return;

		const member = await reaction.message.guild.members.fetch(user.id);
		const role = reaction.message.guild.roles.cache.get(memberRoleId);

		if (!member || !role) return;

		if (!member.roles.cache.has(role.id)) {
			await member.roles.add(role);
		}
	} catch (error) {
		console.error('Error in reaction handler:', error);
	}
}