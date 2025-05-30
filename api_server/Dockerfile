# Python 3.11 슬림 이미지 사용
FROM python:3.11-slim

# 작업 디렉터리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 먼저 설치 (캐시 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 백테스팅 라이브러리 설치 (배포 시)
# 옵션 1: PyPI에서 설치 (라이브러리가 퍼블리시된 경우)
# RUN pip install backtesting

# 옵션 2: 로컬 라이브러리 복사 (현재 권장)
COPY ../backtesting ./backtesting
RUN pip install -e ./backtesting

# 애플리케이션 코드 복사
COPY app ./app
COPY run_server.py .

# 포트 노출
EXPOSE 8000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 