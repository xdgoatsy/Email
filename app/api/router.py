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


class SendVerifyCodeRequest(BaseModel):
    """邮箱验证码 - 请求"""

    to: EmailStr
    username: str
    code: str


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
    "/send-verify-code",
    response_model=SendResponse,
    dependencies=[Depends(verify_api_key)],
)
async def send_verify_code(
    body: SendVerifyCodeRequest,
) -> SendResponse:
    """
    发送邮箱验证码

    MathStudyPlatform 在用户注册/绑定邮箱时调用，向用户发送 6 位验证码。
    用户需在页面输入验证码完成验证。
    """
    ok = await mailer.send_verify_code(
        to=body.to,
        username=body.username,
        code=body.code,
    )
    return SendResponse(
        success=ok,
        message="验证码已发送" if ok else "验证码发送失败",
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
