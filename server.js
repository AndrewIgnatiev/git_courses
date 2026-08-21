// server.js – с OAuth2
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // отключаем проверку сертификата (для локальной разработки)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

let fetch;
try {
    fetch = global.fetch;
} catch (e) {
    fetch = require('node-fetch');
}

const app = express();
app.use(cors());
app.use(express.json());

// Функция получения токена по Client ID и Secret (как на скриншоте)
async function getGigaToken() {
    const clientId = process.env.GIGACHAT_CLIENT_ID;
    const secret = process.env.GIGACHAT_SECRET;
    if (!clientId || !secret) {
        throw new Error('Missing GIGACHAT_CLIENT_ID or GIGACHAT_SECRET in .env');
    }

    const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
            'RqUID': crypto.randomUUID() // или require('uuid').v4() если нет crypto
        },
        body: 'scope=GIGACHAT_API_PERS'
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OAuth error: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Кешируем токен (действует 30 минут)
let cachedToken = null;
let tokenExpiry = 0;

async function getValidToken() {
    const now = Date.now();
    if (cachedToken && tokenExpiry > now) {
        return cachedToken;
    }
    const token = await getGigaToken();
    cachedToken = token;
    tokenExpiry = now + 25 * 60 * 1000; // обновляем через 25 минут (чуть раньше истечения)
    return token;
}

app.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const token = await getValidToken();

        const payload = {
            model: 'GigaChat', // или GigaChat-Plus, GigaChat-Lite
            messages: messages,
            temperature: 0.7,
            max_tokens: 800
        };

        const response = await fetch('https://api.giga.chat/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Ошибка прокси:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Прокси-сервер запущен на порту ${PORT}`);
});