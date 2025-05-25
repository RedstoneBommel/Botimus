import { Events } from 'discord.js';
import dotenv from 'dotenv';
import { updateTotalMembers } from '../utils/statsChannel.js';

dotenv.config();

export const name = Events.GuildMemberRemove;

export async function execute(member) {
    await updateTotalMembers(member.guild);
};