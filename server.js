require('dotenv').config();          // загружаем переменные из .env
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // для HTTP-запросов из Node.js
const app = express();

app.use(cors());                     // разрешаем кросс-доменные запросы
app.use(express.json());             // парсим JSON-тело запроса

// Эндпоинт, который будет принимать запросы от вашего HTML
app.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body; // массив сообщений от клиента
        const apiKey = process.env.GIGACHAT_API_KEY; // ключ из переменной окружения

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const payload = {
            model: 'GigaChat',        // или 'GigaChat-Plus', 'GigaChat-Lite'
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
        res.json(data); // отправляем ответ обратно клиенту
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