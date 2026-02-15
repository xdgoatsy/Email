/**
 * POST /contact - 联系 = 邮箱确认
 * 向用户邮箱发送一封「请点击确认」的邮件（如绑定/验证邮箱）
 * Body: to_email, confirm_url, username?, email?, subject?, confirm_text?, message?
 */
const mailer = require('../mailer');

async function contactRouter(req, res) {
  try {
    const { to_email, confirm_url, username, email, subject, confirm_text, message } = req.body || {};
    if (!to_email || !confirm_url) {
      return res.status(400).json({
        sent: false,
        message: '缺少必填参数: to_email, confirm_url',
      });
    }
    const result = await mailer.sendMail({
      to: to_email,
      subject: subject || '邮箱确认',
      template: 'email_confirm',
      context: { username, email: email || to_email, confirm_url, confirm_text, message },
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[contact]', err.message);
    return res.status(500).json({
      sent: false,
      message: err.message || '发送失败',
    });
  }
}

module.exports = contactRouter;
