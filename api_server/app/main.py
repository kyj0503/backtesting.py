"""
FastAPI 애플리케이션 메인 진입점
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import logging
from datetime import datetime

from .core.config import settings
from .api.v1.api import api_router
from .models.responses import HealthResponse

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.project_name,
    description=settings.description,
    version=settings.version,
    openapi_url=f"{settings.api_v1_str}/openapi.json",
    docs_url=f"{settings.api_v1_str}/docs",
    redoc_url=f"{settings.api_v1_str}/redoc"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(api_router, prefix=settings.api_v1_str)


@app.get("/", include_in_schema=False)
async def root():
    """루트 경로 - API 문서로 리다이렉트"""
    return RedirectResponse(url=f"{settings.api_v1_str}/docs")


@app.get("/health", response_model=HealthResponse, tags=["시스템"])
async def health_check():
    """
    시스템 헬스체크
    
    서버와 주요 서비스들의 상태를 확인합니다.
    """
    try:
        # 데이터 소스 연결 확인
        from .utils.data_fetcher import data_fetcher
        data_healthy = data_fetcher.validate_ticker("AAPL")
        
        if not data_healthy:
            raise HTTPException(status_code=503, detail="데이터 소스 연결 실패")
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now(),
            version=settings.version
        )
        
    except Exception as e:
        logger.error(f"헬스체크 실패: {str(e)}")
        raise HTTPException(status_code=503, detail="서비스 상태 불량")


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    logger.info(f"{settings.project_name} v{settings.version} 시작됨")
    logger.info(f"문서 URL: http://{settings.host}:{settings.port}{settings.api_v1_str}/docs")
    
    # 캐시 디렉토리 생성
    from .utils.data_fetcher import data_fetcher
    data_fetcher.cache_dir.mkdir(exist_ok=True)
    logger.info(f"데이터 캐시 디렉토리: {data_fetcher.cache_dir}")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리"""
    logger.info(f"{settings.project_name} 종료됨")


# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """전역 예외 처리"""
    logger.error(f"처리되지 않은 예외: {str(exc)}")
    return HTTPException(
        status_code=500,
        detail="내부 서버 오류가 발생했습니다."
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    ) 