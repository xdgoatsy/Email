/**
 * 发信测试脚本（两种方式）：
 * 1. 未配置 SMTP：使用 Ethereal 假邮箱，不真实发信，会打印预览链接
 * 2. 已配置 .env：用当前 SMTP 真实发一封测试邮件
 */
const nodemailer = require('nodemailer');
const path = require('path');

// 从项目根目录或当前工作目录加载 .env
const loadEnv = () => {
  const fs = require('fs');
  const tryPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const envPath of tryPaths) {
    try {
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf8');
        content = content.replace(/^\uFEFF/, ''); // 去掉 BOM
        content.split(/\r?\n/).forEach((line) => {
          const m = line.match(/^\s*([^#=]+)=(.*)$/);
          if (m) {
            const key = m[1].trim().replace(/\s/g, '');
            const val = m[2].trim().replace(/^["']|["']$/g, '').replace(/\r$/, '');
            process.env[key] = val;
          }
        });
        break;
      }
    } catch (_) {}
  }
};
loadEnv();

const config = {
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: {
    name: process.env.MAIL_FROM_NAME || '平台邮件',
    address: process.env.MAIL_FROM_ADDRESS || '',
  },
};

async function run() {
  const useRealSmtp = config.smtp.host && config.from.address;
  let transporter;

  if (useRealSmtp) {
    console.log('使用 .env 中的 SMTP 配置发送真实测试邮件...\n');
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  } else {
    console.log('未配置 SMTP，使用 Ethereal 假邮箱（不真实发信，仅生成预览链接）...\n');
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    config.from.address = account.user;
    config.from.name = '测试发件人';
  }

  const to = useRealSmtp ? config.from.address : 'test@example.com';
  const html = `
    <p>这是一封<strong>测试邮件</strong>。</p>
    <p>若你看到此内容，说明发信功能正常。</p>
  `.trim();

  const info = await transporter.sendMail({
    from: `${config.from.name} <${config.from.address}>`,
    to,
    subject: '【邮件服务】发信测试',
    html,
    text: '这是一封测试邮件。若你看到此内容，说明发信功能正常。',
  });

  console.log('发送完成:', info.messageId);
  if (!useRealSmtp) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n在浏览器中打开以下链接可查看邮件预览：');
    console.log(previewUrl);
  } else {
    console.log('收件人:', to);
  }
}

run().catch((err) => {
  console.error('发送失败:', err.message);
  process.exit(1);
});
