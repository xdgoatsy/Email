/**
 * POST /send - 通用按模板发信
 * Body: to_email, subject, template, context
 */
const mailer = require('../mailer');
const config = require('../config');
const templates = require('../templates');

const VALID_TEMPLATES = templates.getTemplateIds();

function maybeRequireApiKey(req, res, next) {
  if (!config.apiKey) return next();
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== config.apiKey) {
    return res.status(401).json({ sent: false, message: '鉴权失败' });
  }
  next();
}

async function sendRouter(req, res) {
  try {
    const { to_email, subject, template, context } = req.body || {};
    if (!to_email || !subject || !template) {
      return res.status(400).json({
        sent: false,
        message: '缺少必填参数: to_email, subject, template',
      });
    }
    if (!VALID_TEMPLATES.includes(template)) {
      return res.status(400).json({
        sent: false,
        message: `无效模板: ${template}，可选: ${VALID_TEMPLATES.join(', ')}`,
      });
    }
    const ctx = typeof context === 'object' && context !== null ? context : {};
    const result = await mailer.sendMail({
      to: to_email,
      subject,
      template,
      context: ctx,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[send]', err.message);
    return res.status(500).json({
      sent: false,
      message: err.message || '发送失败',
    });
  }
}

module.exports = { sendRouter, maybeRequireApiKey };
