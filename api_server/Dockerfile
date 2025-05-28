FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 상위 디렉토리의 backtesting 패키지 복사
COPY ../backtesting /app/backtesting
COPY ../setup.py /app/setup.py
COPY ../pyproject.toml /app/pyproject.toml
COPY ../README.md /app/README.md
COPY ../requirements.txt /app/requirements.txt

# API 서버 코드 복사
COPY . /app/api_server

# 작업 디렉토리를 api_server로 변경
WORKDIR /app/api_server

# Python 패키지 설치
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 백테스팅 라이브러리 설치 (로컬 패키지)
RUN pip install --no-cache-dir -e /app

# 포트 노출
EXPOSE 8000

# 환경변수 설정
ENV PYTHONPATH=/app/api_server
ENV HOST=0.0.0.0
ENV PORT=8000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 