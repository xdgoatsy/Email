# 操作步骤（不用命令行）

全部用**网页 + 编辑器**完成，不需要在终端输入命令。

---

## 一、另开仓库（邮件服务）

### 1. 在 GitHub 网页上新建仓库

1. 打开浏览器，登录 [GitHub](https://github.com)。
2. 点击右上角 **+** → **New repository**。
3. **Repository name** 填：`email-service`（或任意名称）。
4. 选 **Public**，**不要**勾选 "Add a README file"。
5. 点 **Create repository**。
6. 创建好后，页面上会有一个地址，形如：`https://github.com/你的用户名/email-service`，先记住。

### 2. 用 Cursor / VS Code 把代码推上去

1. 在 Cursor 里打开**本邮件项目**所在文件夹（就是你现在这个 Email 项目）。
2. 左侧点 **源代码管理**（或按 `Ctrl+Shift+G`）。
3. 若显示「未初始化 Git 存储库」：
   - 点 **初始化存储库**，然后点 **+** 把变更全部暂存，在上方输入「初始提交」点 ✓ 提交。
4. 若已经有提交记录，直接进行下一步。
5. 点 **···**（更多操作）→ **远程** → **添加远程仓库**：
   - 名称填：`origin`
   - URL 填：`https://github.com/你的用户名/email-service.git`（把「你的用户名」换成你刚建的仓库）
   - 确定。
6. 再点 **···** → **推送**，或顶部 **推送** 按钮，选 `origin` 和分支（没有分支就选「发布分支」选 `main`）。

若推送时提示要登录 GitHub，按提示在浏览器里授权即可。推送成功后，在浏览器打开该仓库地址就能看到代码。

---

## 二、主项目接入（不用命令行）

在主项目里只做「改配置 + 加一个文件 + 在需要发邮件的地方调用」，全部在编辑器里完成。

### 1. 主项目里加环境变量

1. 打开**主项目**（mathstudy）文件夹。
2. 找到 `.env` 文件（没有就复制 `.env.example` 新建一个 `.env`）。
3. 在末尾加一行：
   ```env
   EMAIL_SERVICE_URL=http://localhost:3000
   ```
   保存。  
   生产环境时把这行改成邮件服务真实地址即可。

### 2. 主项目里加「邮件客户端」文件

1. 在主项目里新建文件，例如：`services/emailClient.js`（没有 `services` 文件夹就新建一个）。
2. 打开本邮件仓库里的 **`examples/emailClient.js`**，全选复制。
3. 粘贴到主项目的 `services/emailClient.js` 里，保存。

（若本仓库里没有 `examples/emailClient.js`，可从下面「附录：emailClient.js 完整代码」复制。）

### 3. 在要发邮件的地方调用

在主项目里找到「发邮箱确认」或「忘记密码通过」的逻辑，在对应位置：

- 文件顶部或合适位置加：  
  `const emailClient = require('./services/emailClient');`  
  （路径按你实际放的位置改，例如 `./lib/emailClient`。）
- **发邮箱确认**时调用：  
  `await emailClient.sendEmailConfirm({ to_email: 用户邮箱, confirm_url: 确认链接, username: '用户名' });`
- **忘记密码通过**时调用：  
  `await emailClient.sendPasswordResetApproved({ to_email: 用户邮箱, username: 用户名, temp_password: 临时密码, login_url: '登录页地址' });`

保存后，主项目运行时会自动读 `EMAIL_SERVICE_URL` 去请求邮件服务。  
本地联调时：先在本邮件项目里用 **运行** → **Run Without Debugging** 或 npm 脚本启动邮件服务，再启动主项目。

---

## 三、本地跑邮件服务（不用命令行）

1. 在 Cursor 里打开**本邮件项目**。
2. 在资源管理器里点 `package.json`，看 **scripts** 里的 `"start": "node src/index.js"`。
3. 用下面任一方式启动（都不需要自己输命令）：
   - **终端**里点 **+** 旁的 **▾** → 选 **npm** → 选 **start**；或  
   - 在 `src/index.js` 里点行号旁的 **Run**；或  
   - 若装了 "Code Runner"：右键 `src/index.js` → **Run Code**（需能运行 Node）。
4. 看到类似「监听 http://0.0.0.0:3000」即表示邮件服务已启动。  
然后按上面「主项目接入」配好主项目的 `EMAIL_SERVICE_URL` 并启动主项目即可。

---

## 附录：emailClient.js 完整代码

若本仓库没有 `examples/emailClient.js`，可在主项目新建 `services/emailClient.js`，粘贴下面整段：

```javascript
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
```

保存即可，无需安装额外依赖（Node 18+ 自带 `fetch`）。
