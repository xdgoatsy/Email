# Email Service

独立邮件服务，供 MathStudyPlatform 通过 HTTP 端口调用。部署为容器，通过 bridge 网络通信。

## 功能

1. **邮箱绑定验证**：用户注册/绑定邮箱时发送验证邮件，用户点击确认链接完成验证
2. **密码重置通知**：管理员审批通过密码重置申请后，向用户发送包含临时密码的邮件

## 快速开始

```bash
# 复制配置
cp .env.example .env
# 编辑 .env 填入 SMTP 与 API_KEY

# 本地运行
pip install .
uvicorn app.main:app --host 0.0.0.0 --port 8025

# 或 Docker 运行
docker compose up -d
```

## API

所有接口需在请求头携带 `X-API-Key: <your-api-key>`。

### 1. 发送邮箱验证邮件

```
POST /api/v1/send-verify-email
Content-Type: application/json
X-API-Key: <api-key>

{
  "to": "user@example.com",
  "username": "张三",
  "token": "uuid-or-random-string",
  "confirm_url_base": "https://your-platform.com/auth/verify-email"
}
```

发送后邮件内含链接：`{confirm_url_base}?token={token}`。MathStudyPlatform 需实现该页面，接收 `token` 并调用后端完成邮箱验证。

### 2. 发送密码重置通知

```
POST /api/v1/send-password-reset
Content-Type: application/json
X-API-Key: <api-key>

{
  "to": "user@example.com",
  "username": "张三",
  "temp_password": "user123456"
}
```

管理员审批通过后，由 MathStudyPlatform 后端调用此接口。

## 与 MathStudyPlatform 集成

### 1. Docker 网络互通

将邮件服务加入 MathPlatform 的 bridge 网络，或在 `docker-compose.prod.yml` 中引入本服务：

```yaml
# 在 MathStudyPlatform/docker-compose.prod.yml 中
services:
  # ... 现有服务 ...

  email-service:
    image: email-service:latest  # 或 build 本仓库
    container_name: msp_email
    restart: unless-stopped
    env_file:
      - ./Email/.env
    networks:
      - msp_network
```

### 2. 后端调用示例 (Python)

```python
import httpx

EMAIL_SERVICE_URL = "http://email-service:8025"  # 同 bridge 下的容器名
EMAIL_API_KEY = "your-api-key"

async def send_verify_email(to: str, username: str, token: str, confirm_base: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{EMAIL_SERVICE_URL}/api/v1/send-verify-email",
            headers={"X-API-Key": EMAIL_API_KEY},
            json={
                "to": to,
                "username": username,
                "token": token,
                "confirm_url_base": confirm_base,
            },
        )
        return r.status_code == 200 and r.json().get("success")

async def send_password_reset(to: str, username: str, temp_password: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{EMAIL_SERVICE_URL}/api/v1/send-password-reset",
            headers={"X-API-Key": EMAIL_API_KEY},
            json={"to": to, "username": username, "temp_password": temp_password},
        )
        return r.status_code == 200 and r.json().get("success")
```

### 3. 集成时机

- **邮箱验证**：用户注册时创建未验证用户/待验证记录，调用 `send-verify-email`；前端实现 `/auth/verify-email?token=xxx`，接收后调后端完成验证
- **密码重置**：`password_reset_service.review_request` 在 `action=="approve"` 且修改密码成功后，调用 `send-password-reset`

## 健康检查

```
GET /health
```

返回 `{"status": "ok", "service": "email"}`。
