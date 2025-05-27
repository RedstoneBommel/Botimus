import { Events } from 'discord.js';
import { updateTotalBots, updateTotalMembers } from '../utils/statsChannel.js';

export const name = Events.GuildMemberRemove;

export async function execute(member) {
    await updateTotalMembers(member.guild);
    await updateTotalBots(member.guild);
};