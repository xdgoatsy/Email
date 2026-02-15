/**
 * 邮件模板：按 template 标识返回 HTML 正文
 * 支持 UTF-8（中文等）
 * 正文首行用可见英文，供 163 等客户端做预览用，避免预览区显示 ????
 */
const PREVIEW_LINE = '<p style="font-size:11px;color:#999;margin:0 0 0.5em 0;">Email confirmation.</p>';

const TEMPLATES = {
  /** 邮箱确认：发往用户，带确认链接（如绑定/验证邮箱） */
  email_confirm({ username, email, confirm_url, confirm_text, message }) {
    const greeting = username ? `${escapeHtml(username)}，你好：` : '你好：';
    const desc = message || `正在尝试绑定邮箱 ${escapeHtml(email || '')} 到你的账号。`;
    const btnText = confirm_text || '确认';
    const linkHtml = confirm_url
      ? `<p style="margin-top: 1.2em;"><a href="${escapeHtml(confirm_url)}" style="display: inline-block; padding: 12px 24px; background: #07c160; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">${escapeHtml(btnText)}</a></p>`
      : '';
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; line-height: 1.6;">
${PREVIEW_LINE}
  <h2>邮箱确认</h2>
  <p>${greeting}</p>
  <p>${desc}</p>
  <p>如果这是你的操作，请点击下方按钮完成确认。</p>
  ${linkHtml}
  <p style="color: #666; font-size: 0.9em;">如果你没有进行此操作，请忽略此邮件。</p>
  <p style="margin-top: 1.5em;">此致</p>
</body>
</html>`.trim();
  },

  password_reset_approved({ username, temp_password, login_url }) {
    const loginPart = login_url
      ? `请点击以下链接登录：<a href="${escapeHtml(login_url)}">${escapeHtml(login_url)}</a>`
      : '请使用临时密码登录系统。';
    const previewLine = '<p style="font-size:11px;color:#999;margin:0 0 0.5em 0;">Password reset notification.</p>';
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; line-height: 1.6;">
${previewLine}
  <h2>密码已重置</h2>
  <p>您好，${escapeHtml(username || '用户')}：</p>
  <p>您的「忘记密码」申请已通过，管理员已为您重置密码。</p>
  <p><strong>临时密码：</strong> ${escapeHtml(temp_password || '')}</p>
  <p>建议您登录后尽快修改密码。</p>
  <p>${loginPart}</p>
</body>
</html>`.trim();
  },
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(templateId, context = {}) {
  const fn = TEMPLATES[templateId];
  if (!fn) return null;
  return fn(context);
}

function getTemplateIds() {
  return Object.keys(TEMPLATES);
}

module.exports = { render, getTemplateIds };
