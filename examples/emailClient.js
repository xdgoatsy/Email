/**
 * 邮件服务客户端 - 主项目复制此文件使用
 * 主项目环境变量：EMAIL_SERVICE_URL（必填）, EMAIL_SERVICE_API_KEY（可选）
 */
const BASE_URL = (process.env.EMAIL_SERVICE_URL || '').replace(/\/$/, '');
const API_KEY = process.env.EMAIL_SERVICE_API_KEY || '';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (API_KEY) h['X-Api-Key'] = API_KEY;
  return h;
}

async function healthCheck() {
  if (!BASE_URL) return { ok: false };
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.status === 'ok' };
  } catch (e) {
    return { ok: false };
  }
}

async function sendEmailConfirm(opts) {
  const { to_email, confirm_url, username, subject, confirm_text, message, email } = opts;
  if (!BASE_URL) throw new Error('EMAIL_SERVICE_URL 未配置');
  const res = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ to_email, confirm_url, username, email, subject, confirm_text, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function sendPasswordResetApproved(opts) {
  const { to_email, subject = '密码已重置', username, temp_password, login_url } = opts;
  if (!BASE_URL) throw new Error('EMAIL_SERVICE_URL 未配置');
  const res = await fetch(`${BASE_URL}/send`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      to_email,
      subject,
      template: 'password_reset_approved',
      context: { username, temp_password, login_url },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

module.exports = { healthCheck, sendEmailConfirm, sendPasswordResetApproved };
