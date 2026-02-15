/**
 * Express 应用：/health, /send, /contact
 * 仅按请求发信，不校验主项目用户身份
 */
const express = require('express');
const healthRouter = require('./routes/health');
const { sendRouter, maybeRequireApiKey } = require('./routes/send');
const contactRouter = require('./routes/contact');

const app = express();
app.use(express.json({ limit: '256kb' }));

app.get('/health', healthRouter);
app.post('/send', maybeRequireApiKey, sendRouter);
app.post('/contact', maybeRequireApiKey, contactRouter);

module.exports = app;
