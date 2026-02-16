# MathStudyPlatform 集成说明

本文档供 MathStudyPlatform 团队参考，说明如何接入独立邮件服务。**代码仅在 Email 仓库修改，MathPlatform 需自行添加调用逻辑。**

## 1. 部署方式

### 独立部署

Email 服务可单独运行：

```bash
cd d:/Study/Email
cp .env.example .env
# 编辑 .env 配置 SMTP 和 API_KEY
docker compose up -d
```

### 与 MathPlatform 同网段（bridge）

在 MathStudyPlatform 的 `docker-compose.prod.yml` 中加入：

```yaml
services:
  # ... 现有 postgres, redis, backend, frontend ...

  email-service:
    build: ../Email  # 或使用 image: email-service:latest
    container_name: msp_email
    restart: unless-stopped
    env_file:
      - ../Email/.env
    networks:
      - msp_network
    healthcheck:
      test: ["CMD", "python", "-c", "import httpx; httpx.get('http://localhost:8025/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
```

后端访问地址：`http://email-service:8025`

## 2. 调用接口

### 2.1 邮箱绑定验证

**接口**：`POST /api/v1/send-verify-code`  
**Header**：`X-API-Key: <你的 API_KEY>`

**请求体**：
```json
{
  "to": "user@example.com",
  "username": "张三",
  "code": "123456"
}
```

**调用时机**：用户注册/绑定邮箱时，后端生成 6 位验证码、存入数据库（如 `email_verification_tokens`），并调用此接口发送邮件。

**MathPlatform 需实现**：
- 后端接口 `POST /auth/verify-email-by-code`：接收 `email` 和 `code`，校验后标记邮箱已验证
- 前端：用户输入验证码后调用该接口完成验证

### 2.2 密码重置通知

**接口**：`POST /api/v1/send-password-reset`  
**Header**：`X-API-Key: <你的 API_KEY>`

**请求体**：
```json
{
  "to": "user@example.com",
  "username": "张三",
  "temp_password": "user123456"
}
```

**调用时机**：管理员审批通过密码重置申请后，在 `password_reset_service.review_request` 中，`action == "approve"` 且已更新用户密码后立即调用。

## 3. 后端调用示例（FastAPI）

在 MathPlatform 后端新增 `app/services/email_client.py`：

```python
import logging
import httpx

logger = logging.getLogger(__name__)

EMAIL_SERVICE_URL = "http://email-service:8025"  # Docker 内网
EMAIL_API_KEY = "your-api-key"  # 从 settings 读取


async def send_verify_code(to: str, username: str, code: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{EMAIL_SERVICE_URL}/api/v1/send-verify-code",
                headers={"X-API-Key": EMAIL_API_KEY},
                json={"to": to, "username": username, "code": code},
            )
            data = r.json()
            return r.status_code == 200 and data.get("success", False)
    except Exception as e:
        logger.exception("发送验证码邮件失败: %s", e)
        return False


async def send_password_reset(to: str, username: str, temp_password: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{EMAIL_SERVICE_URL}/api/v1/send-password-reset",
                headers={"X-API-Key": EMAIL_API_KEY},
                json={"to": to, "username": username, "temp_password": temp_password},
            )
            data = r.json()
            return r.status_code == 200 and data.get("success", False)
    except Exception as e:
        logger.exception("发送密码重置邮件失败: %s", e)
        return False
```

在 `password_reset_service.review_request` 中，`action == "approve"` 分支内，密码更新后添加：

```python
# 在 user.hashed_password = ... 之后
from app.services.email_client import send_password_reset
await send_password_reset(
    to=request.email,
    username=request.username,
    temp_password=DEFAULT_RESET_PASSWORD,
)
```

## 4. 环境变量

MathPlatform 后端需新增：
- `EMAIL_SERVICE_URL`：默认 `http://email-service:8025`
- `EMAIL_API_KEY`：与 Email 服务 `.env` 中的 `API_KEY` 一致
