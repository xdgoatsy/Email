/**
 * 发信封装：SMTP 配置外置，UTF-8 编码，失败打日志
 * 对主题、发件人名称做 RFC 2047 编码，避免部分客户端显示 ????
 */
const nodemailer = require('nodemailer');
const config = require('./config');
const templates = require('./templates');

let transporter = null;

/** 若配置「邮件头用英文」，主题用英文，避免 163 等客户端预览区 ??? */
function resolveSubject(subject, template) {
  if (config.headersInEnglish && template === 'password_reset_approved') return 'Password Reset';
  if (config.headersInEnglish && template === 'email_confirm') return 'Email Confirmation';
  return subject;
}

function getTransporter() {
  if (transporter) return transporter;
  const { smtp, from } = config;
  if (!smtp.host || !from.address) {
    throw new Error('SMTP 或发件人未配置（SMTP_HOST / MAIL_FROM_ADDRESS）');
  }
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  return transporter;
}

/**
 * 按模板发送邮件
 * @param {object} opts - { to, subject, template, context, replyTo }
 * @returns {Promise<{ sent: boolean, message?: string }>}
 */
async function sendMail(opts) {
  const { to, subject, template, context = {}, replyTo } = opts;
  const html = templates.render(template, context);
  if (html == null) {
    throw new Error(`未知模板: ${template}`);
  }
  const transport = getTransporter();
  const fromName = config.headersInEnglish ? 'Platform' : config.from.name;
  const from = { name: fromName, address: config.from.address };
  const subjectResolved = resolveSubject(subject, template);
  try {
    await transport.sendMail({
      from,
      to,
      replyTo: replyTo || undefined,
      subject: subjectResolved,
      html,
    });
    return { sent: true, message: '发送成功' };
  } catch (err) {
    // 关键发送失败打日志，不暴露密码
    console.error('[mailer] 发送失败', {
      to,
      subject: subject ? '(已设置)' : '(空)',
      template,
      error: err.message,
    });
    throw err;
  }
}

module.exports = { sendMail, getTransporter };
