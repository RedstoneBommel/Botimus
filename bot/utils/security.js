import crypto from 'crypto';

export function generateUniqueState(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}