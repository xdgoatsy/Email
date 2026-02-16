"""邮件发送服务"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


class Mailer:
    """SMTP 邮件发送"""

    def __init__(self) -> None:
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.use_tls = settings.smtp_use_tls
        self.start_tls = settings.smtp_start_tls
        self.user = settings.smtp_user
        self.password = settings.smtp_password
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name

    async def send(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> bool:
        """
        发送邮件

        Args:
            to: 收件人邮箱
            subject: 主题
            html_body: HTML 正文
            text_body: 纯文本正文（可选，部分客户端不支持 HTML 时使用）

        Returns:
            是否发送成功
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.host,
                port=self.port,
                use_tls=self.use_tls,
                start_tls=self.start_tls,
                username=self.user if self.user else None,
                password=self.password if self.password else None,
            )
            logger.info("邮件已发送: to=%s, subject=%s", to, subject)
            return True
        except Exception as e:
            logger.exception("邮件发送失败: to=%s, error=%s", to, e)
            return False

    async def send_verify_code(
        self,
        to: str,
        username: str,
        code: str,
    ) -> bool:
        """
        发送邮箱验证码

        用于邮箱绑定/注册验证，用户需在页面输入验证码完成验证。
        """
        subject = "您的邮箱验证码 - MathStudyPlatform"

        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px;">
    <h2>邮箱验证码</h2>
    <p>您好，{username}：</p>
    <p>您正在 MathStudyPlatform 绑定/验证邮箱，您的验证码为：</p>
    <p style="margin: 24px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; font-family: monospace; font-size: 28px; letter-spacing: 8px; text-align: center;">{code}</p>
    <p style="color: #666; font-size: 14px;">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">此邮件由系统自动发送，请勿直接回复。</p>
  </div>
</body>
</html>
"""

        text_body = f"""您好，{username}：

您正在 MathStudyPlatform 绑定/验证邮箱，您的验证码为：

{code}

验证码 10 分钟内有效。如非本人操作，请忽略此邮件。
"""
        return await self.send(to=to, subject=subject, html_body=html_body, text_body=text_body)

    async def send_password_reset(
        self,
        to: str,
        username: str,
        temp_password: str,
    ) -> bool:
        """
        发送密码重置通知（管理员审批通过后）

        包含临时密码，提醒用户尽快修改
        """
        subject = "密码重置已通过 - MathStudyPlatform"

        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px;">
    <h2>密码重置通知</h2>
    <p>您好，{username}：</p>
    <p>您申请的密码重置已通过管理员审批。您的临时密码如下：</p>
    <p style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 18px; letter-spacing: 2px;">{temp_password}</p>
    <p style="color: #d32f2f;">请使用该临时密码登录后立即修改密码，以确保账户安全。</p>
    <p style="color: #666; font-size: 14px;">如非本人申请，请联系管理员处理。</p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">此邮件由系统自动发送，请勿直接回复。</p>
  </div>
</body>
</html>
"""

        text_body = f"""您好，{username}：

您申请的密码重置已通过管理员审批。您的临时密码如下：

{temp_password}

请使用该临时密码登录后立即修改密码，以确保账户安全。
如非本人申请，请联系管理员处理。
"""
        return await self.send(to=to, subject=subject, html_body=html_body, text_body=text_body)
