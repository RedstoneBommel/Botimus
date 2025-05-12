import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function getTwitchAccessToken() {
    const params = new URLSearchParams();

    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', params);
        return response.data.access_token;
    } catch (error) {
        console.error('Error while fetching twitch token:', error.response?.data || error.message);
        throw error;
    }
};