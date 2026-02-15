/**
 * 配置来自环境变量，不写死敏感信息
 */
function getEnv(key, defaultValue) {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  return v;
}

module.exports = {
  port: parseInt(getEnv('PORT', '3000'), 10),
  smtp: {
    host: getEnv('SMTP_HOST', ''),
    port: parseInt(getEnv('SMTP_PORT', '587'), 10),
    secure: getEnv('SMTP_SECURE', 'false') === 'true',
    user: getEnv('SMTP_USER', ''),
    pass: getEnv('SMTP_PASS', ''),
  },
  from: {
    name: getEnv('MAIL_FROM_NAME', '平台邮件'),
    address: getEnv('MAIL_FROM_ADDRESS', ''),
  },
  /** 可选：API Key 鉴权，主项目约定后设置 */
  apiKey: getEnv('EMAIL_SERVICE_API_KEY', ''),
  /** 默认 true：发件人名称与主题用英文，避免 163 收件箱主题栏显示 ???。设为 false 可改回中文 */
  headersInEnglish: getEnv('MAIL_HEADERS_IN_ENGLISH', 'true') !== 'false',
};
