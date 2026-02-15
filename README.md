# 独立邮件服务

为平台提供发邮件能力：**联系 = 邮箱确认**（发确认邮件给用户）、忘记密码结果通知。与主项目（mathstudy）无代码/数据库耦合，仅通过 HTTP 接口对接。

## 功能

- **联系（邮箱确认）**：`POST /contact` 向**用户邮箱**发送一封「请点击确认」的邮件（如绑定/验证邮箱），带确认链接，类似微信绑定邮箱确认。
- **忘记密码通过**：`POST /send`（template=password_reset_approved），向用户发送临时密码与登录链接。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查，响应 `{"status":"ok"}` |
| POST | /send | 通用按模板发信 |
| POST | /contact | 联系 = 邮箱确认（发确认邮件给用户） |

### POST /contact 请求体（JSON）— 邮箱确认

- `to_email`（必填）：收件人（要收到确认邮件的用户邮箱）
- `confirm_url`（必填）：用户点击「确认」后跳转的链接（主项目生成，带 token 等）
- `username`（可选）：显示在邮件里的称呼
- `email`（可选）：显示在邮件里的邮箱，默认用 to_email
- `subject`（可选）：邮件主题，默认「邮箱确认」
- `confirm_text`（可选）：确认按钮文字，默认「确认」
- `message`（可选）：自定义说明文案，默认「正在尝试绑定邮箱 xxx 到你的账号。」

### POST /send 请求体（JSON）

- `to_email`（必填）：收件人
- `subject`（必填）：主题
- `template`（必填）：`email_confirm` \| `password_reset_approved`
- `context`（必填，可空对象）：模板变量。`email_confirm` 见上；忘记密码用 `username`、`temp_password`、`login_url` 等

## 配置

全部通过环境变量，见 `.env.example`。无硬编码敏感信息。

- `PORT`：服务端口，默认 3000
- `SMTP_*`：SMTP 服务器与认证
- `MAIL_FROM_*`：发件人
- `EMAIL_SERVICE_API_KEY`（可选）：设置后请求需带 `X-Api-Key` 头

## 运行

```bash
npm install
npm start
```

开发时可用 `npm run dev`（带 watch）。

## 测试发信

### 方式一：不配置 SMTP（看预览）

不配置 `.env`，直接运行：

```bash
npm run test:email
```

脚本会使用 [Ethereal](https://ethereal.email/) 假邮箱发一封测试邮件（不会真实投递），并在控制台打印一个**预览链接**，浏览器打开即可看到邮件内容，用于确认模板和编码正常。

### 方式二：配置真实 SMTP 后测试

1. 复制并填写配置：
   ```bash
   copy .env.example .env
   # 编辑 .env，填写 SMTP_HOST、SMTP_USER、SMTP_PASS、MAIL_FROM_ADDRESS 等
   ```
2. 运行测试脚本（会向发件人地址发一封真实邮件）：
   ```bash
   npm run test:email
   ```

### 方式三：启动服务后用 curl 调接口

1. 配置好 `.env` 后 `npm start` 启动服务。
2. 健康检查：
   ```bash
   curl http://localhost:3000/health
   ```
3. 联系（邮箱确认，发到用户邮箱）：
   ```bash
   curl -X POST http://localhost:3000/contact -H "Content-Type: application/json" -d "{\"to_email\":\"user@example.com\",\"confirm_url\":\"https://yoursite.com/confirm?token=xxx\",\"username\":\"张三\"}"
   ```
4. 忘记密码通过（把 `your@email.com` 改成要收到的邮箱）：
   ```bash
   curl -X POST http://localhost:3000/send -H "Content-Type: application/json" -d "{\"to_email\":\"your@email.com\",\"subject\":\"密码已重置\",\"template\":\"password_reset_approved\",\"context\":{\"username\":\"testuser\",\"temp_password\":\"Temp123!\",\"login_url\":\"https://example.com/login\"}}"
   ```

## 与主项目对接

主项目配置 `EMAIL_SERVICE_URL` 指向本服务根地址，在相应时机调用上述接口；本模块不校验主项目用户身份，仅按请求参数发信。

**操作步骤（可完全不用命令行）**：见 [SETUP-无需命令行.md](./SETUP-无需命令行.md)。
