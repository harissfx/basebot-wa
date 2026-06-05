'use strict';



const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TOKEN_FILE = path.join(__dirname, '../database/token.json');

function loadToken() {
    try {
        if (fs.existsSync(TOKEN_FILE)) {
            const data = fs.readFileSync(TOKEN_FILE, 'utf-8');
            return JSON.parse(data).token;
        }
        return null;
    } catch {
        return null;
    }
}

function saveToken(token) {
    try {
        const dir = path.dirname(TOKEN_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
    } catch { }
}

function isTokenValid(token) {
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token, { complete: true });
        const exp = decoded?.payload?.exp;
        return exp && exp > Math.floor(Date.now() / 1000) + 60;
    } catch {
        return false;
    }
}

async function getNewToken() {
    try {
        const response = await axios.post(
            'https://beryllium.mapclub.com/api/auth/token',
            { platform: 'WEB' },
            { headers: { 'Content-Type': 'application/json', 'Client-Platform': 'WEB' } }
        );
        const token = response.data?.data?.[0]?.accessToken;
        if (token) {
            saveToken(token);
            return token;
        }
        return null;
    } catch {
        return null;
    }
}

async function sendOtp(phoneNumber, token) {
    return axios.post(
        'https://beryllium.mapclub.com/api/member/registration/sms/otp?channel=WHATSAPP',
        { account: phoneNumber, prefix: '62' },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Client-Platform': 'WEB' } }
    );
}

module.exports = {
    loadToken,
    saveToken,
    isTokenValid,
    getNewToken,
    sendOtp,
};