const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
const chatApiUrl = process.env.CHAT_API_URL || 'http://localhost:8000/api/v1/chat';
const chatApiKey = process.env.CHAT_API_KEY || '';

app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh trừ index.html để inject biến môi trường
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Custom route cho trang chủ để inject BACKEND_URL từ .env vào index.html
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) {
            return res.status(500).send('Error loading index.html');
        }
        const updatedHtml = html.replace(
            /data-backend-url="[^"]*"/g,
            `data-backend-url="${backendUrl}"`
        ).replace(
            /src="\/widget\.js"/g,
            `src="${backendUrl}/widget.js"`
        );
        res.send(updatedHtml);
    });
});

// Khởi tạo PostgreSQL Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// API lấy lịch sử chat theo userId
app.get('/api/history', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const convResult = await pool.query('SELECT id FROM conversations WHERE user_id = $1', [userId]);
        if (convResult.rows.length === 0) {
            return res.json({ messages: [] });
        }

        const conversationId = convResult.rows[0].id;

        const msgResult = await pool.query(
            'SELECT role, content, message_type, metadata, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
            [conversationId]
        );
        res.json({ messages: msgResult.rows });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// API nhận câu hỏi, gửi sang CHAT_API_URL kèm header API Key và lưu trữ vào PostgreSQL
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId = 'anonymous' } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let convResult = await pool.query('SELECT id FROM conversations WHERE user_id = $1', [userId]);
        let conversationId;

        if (convResult.rows.length === 0) {
            const newConv = await pool.query(
                'INSERT INTO conversations (user_id) VALUES ($1) RETURNING id',
                [userId]
            );
            conversationId = newConv.rows[0].id;
        } else {
            conversationId = convResult.rows[0].id;
            await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
        }

        let apiData = { reply: `Xin lỗi, không thể kết nối đến hệ thống xử lý chat (${chatApiUrl}).` };
        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-API-Key': chatApiKey,
            };

            const apiRes = await fetch(chatApiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    conversation_id: userId,
                    message: message
                })
            });
            const textResp = await apiRes.text();
            try {
                apiData = JSON.parse(textResp);
            } catch (e) {
                apiData = { reply: textResp };
            }
        } catch (fetchErr) {
            console.error(`Error calling ${chatApiUrl}:`, fetchErr.message);
        }

        res.json(apiData);
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Chat widget server running at http://localhost:${port}`);
});
