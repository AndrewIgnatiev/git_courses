// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Проверяем наличие встроенного fetch (Node.js 18+)
let fetch;
try {
    fetch = global.fetch; // если есть, используем его
} catch (e) {
    fetch = require('node-fetch'); // иначе подключаем node-fetch
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const apiKey = process.env.GIGACHAT_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const payload = {
            model: 'GigaChat', // или 'GigaChat-Plus', 'GigaChat-Lite'
            messages: messages,
            temperature: 0.7,
            max_tokens: 800
        };

        const response = await fetch('https://api.giga.chat/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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
    console.log(`➡️  Отправляйте POST-запросы на http://localhost:${PORT}/chat`);
});