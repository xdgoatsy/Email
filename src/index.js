/**
 * 独立邮件服务入口
 * 可单独进程/容器部署，配置来自环境变量；若存在 .env 则自动加载
 */
require('dotenv').config();
const app = require('./app');
const config = require('./config');

const port = config.port;
app.listen(port, () => {
  console.log(`[email-service] 监听 http://0.0.0.0:${port}`);
});
