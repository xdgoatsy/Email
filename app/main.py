"""邮件服务入口"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import router as api_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # 可在此添加启动/关闭逻辑


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(api_router, prefix="/api/v1", tags=["email"])


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok", "service": "email"}
