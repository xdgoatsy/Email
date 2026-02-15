"""邮件服务 API"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.api.deps import verify_api_key
from app.services.mailer import Mailer

router = APIRouter()
mailer = Mailer()


# =============================================================================
# 请求模型
# =============================================================================


class SendVerifyEmailRequest(BaseModel):
    """邮箱绑定验证 - 请求"""

    to: EmailStr
    username: str
    token: str
    confirm_url_base: str


class SendPasswordResetRequest(BaseModel):
    """密码重置通知 - 请求"""

    to: EmailStr
    username: str
    temp_password: str


class SendResponse(BaseModel):
    """发送响应"""

    success: bool
    message: str


# =============================================================================
# 端点
# =============================================================================


@router.post(
    "/send-verify-email",
    response_model=SendResponse,
    dependencies=[Depends(verify_api_key)],
)
async def send_verify_email(
    body: SendVerifyEmailRequest,
) -> SendResponse:
    """
    发送邮箱绑定验证邮件

    MathStudyPlatform 在用户注册/绑定邮箱时调用，向用户发送带确认链接的邮件。
    用户需点击链接完成验证。
    """
    ok = await mailer.send_verify_email(
        to=body.to,
        username=body.username,
        token=body.token,
        confirm_url_base=body.confirm_url_base,
    )
    return SendResponse(
        success=ok,
        message="验证邮件已发送" if ok else "验证邮件发送失败",
    )


@router.post(
    "/send-password-reset",
    response_model=SendResponse,
    dependencies=[Depends(verify_api_key)],
)
async def send_password_reset(
    body: SendPasswordResetRequest,
) -> SendResponse:
    """
    发送密码重置通知邮件

    管理员审批通过密码重置申请后，MathStudyPlatform 调用此接口，
    向用户发送包含临时密码的邮件。
    """
    ok = await mailer.send_password_reset(
        to=body.to,
        username=body.username,
        temp_password=body.temp_password,
    )
    return SendResponse(
        success=ok,
        message="密码重置邮件已发送" if ok else "密码重置邮件发送失败",
    )
