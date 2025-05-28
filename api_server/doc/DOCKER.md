# 🐳 Docker 배포 가이드

## 📋 개요

백테스팅 API 서버를 Docker 컨테이너로 배포하는 방법을 설명합니다. Docker를 사용하면 환경에 관계없이 일관된 실행 환경을 제공할 수 있습니다.

## 🚀 빠른 시작

### 1. Docker 단일 컨테이너 실행

```bash
# 1. 이미지 빌드
docker build -t backtest-api .

# 2. 컨테이너 실행
docker run -p 8000:8000 backtest-api

# 3. API 접속 확인
curl http://localhost:8000/health
```

### 2. Docker Compose 사용

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f api

# 서비스 중지
docker-compose down
```

## 📁 Docker 구성 파일

### Dockerfile

```dockerfile
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY app/ ./app/
COPY run_server.py .

# 포트 노출
EXPOSE 8000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 애플리케이션 실행
CMD ["python", "run_server.py"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: backtest-api
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=INFO
      - DEBUG=false
      - HOST=0.0.0.0
      - PORT=8000
    volumes:
      - ./data_cache:/app/data_cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: backtest-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  data_cache:
    driver: local

networks:
  default:
    name: backtest-network
```

## ⚙️ 환경 설정

### 환경 변수

Docker 컨테이너에서 사용할 수 있는 환경 변수들:

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `LOG_LEVEL` | 로그 레벨 | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `DEBUG` | 디버그 모드 | `false` | `true`, `false` |
| `HOST` | 서버 바인딩 호스트 | `0.0.0.0` | `127.0.0.1`, `0.0.0.0` |
| `PORT` | 서버 포트 | `8000` | `8000`, `9000` |
| `CORS_ORIGINS` | CORS 허용 도메인 | `["*"]` | `["http://localhost:3000"]` |

### .env 파일 예시

```bash
# .env
LOG_LEVEL=INFO
DEBUG=false
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:3000", "https://mydomain.com"]
```

## 🔧 고급 배포 옵션

### 1. 멀티 스테이지 빌드

```dockerfile
# 멀티 스테이지 Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

# 빌드된 패키지 복사
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

WORKDIR /app
COPY app/ ./app/
COPY run_server.py .

EXPOSE 8000
CMD ["python", "run_server.py"]
```

### 2. Nginx 리버스 프록시 설정

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backtest_api {
        server api:8000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://backtest_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://backtest_api/health;
            access_log off;
        }
    }
}
```

### 3. SSL/HTTPS 설정

```yaml
# docker-compose.ssl.yml
version: '3.8'

services:
  api:
    build: .
    container_name: backtest-api
    expose:
      - "8000"
    environment:
      - LOG_LEVEL=INFO
    volumes:
      - ./data_cache:/app/data_cache
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: backtest-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.ssl.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    container_name: backtest-certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./html:/var/www/html
    command: certonly --webroot --webroot-path=/var/www/html --email your-email@example.com --agree-tos --no-eff-email -d yourdomain.com
```

## 📊 모니터링 및 로깅

### 1. Docker Compose 로그 관리

```bash
# 모든 서비스 로그 확인
docker-compose logs

# 특정 서비스 로그 확인
docker-compose logs api

# 실시간 로그 추적
docker-compose logs -f api

# 최근 100줄 로그
docker-compose logs --tail 100 api
```

### 2. 로그 로테이션 설정

```yaml
# docker-compose.yml (로그 설정 추가)
services:
  api:
    build: .
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 헬스체크 모니터링

```bash
# 컨테이너 상태 확인
docker-compose ps

# 헬스체크 상세 정보
docker inspect backtest-api | grep -A 20 "Health"

# 헬스체크 로그
docker logs backtest-api | grep health
```

## 🔧 개발 환경 설정

### 1. 개발용 Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    container_name: backtest-api-dev
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=DEBUG
      - DEBUG=true
    volumes:
      - .:/app
      - ./data_cache:/app/data_cache
    restart: unless-stopped
    command: ["python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. 개발용 Dockerfile

```dockerfile
# Dockerfile.dev
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# 개발용 추가 패키지
RUN pip install ipython black isort mypy

# 애플리케이션 볼륨 마운트
VOLUME ["/app"]

EXPOSE 8000

# 기본 명령어 (docker-compose에서 오버라이드)
CMD ["python", "run_server.py"]
```

## 🚀 프로덕션 배포

### 1. 프로덕션용 설정

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: backtest-api-prod
    restart: always
    environment:
      - LOG_LEVEL=WARNING
      - DEBUG=false
    volumes:
      - data_cache:/app/data_cache
      - logs:/app/logs
    expose:
      - "8000"
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  nginx:
    image: nginx:alpine
    container_name: backtest-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: always

volumes:
  data_cache:
  logs:
```

### 2. CI/CD 파이프라인 예시 (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and Push Docker Image
      run: |
        docker build -t backtest-api:latest .
        docker tag backtest-api:latest ${{ secrets.DOCKER_REGISTRY }}/backtest-api:latest
        docker push ${{ secrets.DOCKER_REGISTRY }}/backtest-api:latest
    
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/backtest-api
          docker-compose pull
          docker-compose up -d
          docker-compose logs --tail 50
```

## 🔍 트러블슈팅

### 1. 일반적인 문제들

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8000

# 다른 포트로 실행
docker run -p 8001:8000 backtest-api
```

#### 메모리 부족
```bash
# 컨테이너 리소스 사용량 확인
docker stats backtest-api

# 메모리 제한 설정
docker run -m 2g backtest-api
```

#### 권한 문제
```bash
# 데이터 디렉토리 권한 설정
sudo chown -R 1000:1000 ./data_cache

# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
```

### 2. 디버깅 명령어

```bash
# 컨테이너 내부 접속
docker exec -it backtest-api bash

# 로그 실시간 확인
docker logs -f backtest-api

# 컨테이너 상태 상세 정보
docker inspect backtest-api

# 네트워크 연결 확인
docker network ls
docker network inspect backtest-network
```

### 3. 성능 최적화

```bash
# 이미지 크기 최적화
docker images | grep backtest-api

# 불필요한 이미지 정리
docker image prune -a

# 캐시 정리
docker builder prune
```

## 📱 모바일/원격 접속

### 1. 방화벽 설정

```bash
# Ubuntu/Debian
sudo ufw allow 8000
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

### 2. 외부 접속 설정

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "0.0.0.0:8000:8000"  # 모든 인터페이스에서 접속 허용
    environment:
      - HOST=0.0.0.0
```

## 🔐 보안 고려사항

### 1. 컨테이너 보안

```dockerfile
# 보안 강화 Dockerfile
FROM python:3.11-slim

# 비root 사용자 생성
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# 의존성 설치 (root 권한 필요)
COPY requirements.txt .
RUN pip install -r requirements.txt

# 애플리케이션 파일 복사
COPY --chown=appuser:appgroup app/ ./app/
COPY --chown=appuser:appgroup run_server.py .

# 비root 사용자로 전환
USER appuser

EXPOSE 8000
CMD ["python", "run_server.py"]
```

### 2. 네트워크 보안

```yaml
# docker-compose.yml
services:
  api:
    build: .
    networks:
      - internal
    expose:
      - "8000"
    # 외부 포트 노출하지 않음

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    networks:
      - internal
      - external
    depends_on:
      - api

networks:
  internal:
    driver: bridge
    internal: true
  external:
    driver: bridge
```

---

## 📞 지원

Docker 배포 관련 문제가 발생하면:

1. **GitHub Issues**: 버그 리포트 및 기능 요청
2. **Discord**: 실시간 도움
3. **Documentation**: 상세 가이드 및 FAQ

**주의**: 프로덕션 환경에서는 보안 설정을 철저히 검토하고, 정기적인 업데이트를 수행하세요. 