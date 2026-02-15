"""邮件服务配置"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 服务配置
    app_name: str = "Email Service"
    debug: bool = False
    port: int = 8025

    # API 安全：调用方需携带此 key
    api_key: str = "change-me-in-production"

    # SMTP 配置
    smtp_host: str = "smtp.example.com"
    smtp_port: int = 587
    smtp_use_tls: bool = False  # 465 用 True，587 用 False + start_tls
    smtp_start_tls: bool = True  # 587 端口启用 STARTTLS
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@example.com"
    smtp_from_name: str = "MathStudyPlatform"


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
