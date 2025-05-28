# 배포 가이드

이 문서는 Backtesting API 서버를 프로덕션 환경에 배포하는 방법을 설명합니다.

## 🏗️ 배포 구조 선택

### 옵션 1: 독립적인 API 서버 (권장)

```bash
# 1. 배포용 디렉터리 생성
mkdir backtesting-api-deploy
cd backtesting-api-deploy

# 2. API 서버 코드 복사
cp -r /path/to/backtesting.py/api_server/* .

# 3. 백테스팅 라이브러리 복사
cp -r /path/to/backtesting.py/backtesting ./

# 4. requirements.txt 수정 (독립적 의존성)
# -e ../ 제거하고 직접 의존성 추가
```

### 옵션 2: 패키지 설치 방식

```bash
# PyPI에 라이브러리 퍼블리시 후
pip install backtesting-py
```

## 🐳 Docker 배포

### 1. Dockerfile 사용

```bash
# api_server 디렉터리에서
docker build -t backtesting-api .
docker run -p 8000:8000 backtesting-api
```

### 2. Docker Compose 사용

```bash
# docker-compose.yml 사용
docker-compose up --build -d
```

## ☁️ AWS 배포

### AWS EC2에 배포

#### 1. EC2 인스턴스 설정

```bash
# 1. Ubuntu 22.04 LTS 인스턴스 생성
# 2. 보안 그룹에서 8000 포트 허용
# 3. SSH 접속

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
```

#### 2. 코드 배포

```bash
# Git에서 코드 클론
git clone <your-repo-url>
cd backtesting-api

# Docker로 실행
docker-compose up --build -d

# 또는 직접 Python 환경 구성
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. 프로세스 관리 (systemd)

```bash
# /etc/systemd/system/backtesting-api.service 생성
sudo nano /etc/systemd/system/backtesting-api.service
```

```ini
[Unit]
Description=Backtesting API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/backtesting-api
Environment=PATH=/home/ubuntu/backtesting-api/venv/bin
ExecStart=/home/ubuntu/backtesting-api/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 등록 및 시작
sudo systemctl daemon-reload
sudo systemctl enable backtesting-api
sudo systemctl start backtesting-api
sudo systemctl status backtesting-api
```

### AWS ECS 배포

#### 1. ECR에 이미지 푸시

```bash
# ECR 리포지토리 생성
aws ecr create-repository --repository-name backtesting-api

# Docker 이미지 빌드 및 푸시
docker build -t backtesting-api .
docker tag backtesting-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/backtesting-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/backtesting-api:latest
```

#### 2. ECS 태스크 정의

```json
{
  "family": "backtesting-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backtesting-api",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/backtesting-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/backtesting-api",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🖥️ 우분투 서버 배포

### 1. 시스템 준비

```bash
# 필수 패키지 설치
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx certbot python3-certbot-nginx -y

# 방화벽 설정
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. 애플리케이션 배포

```bash
# 사용자 생성
sudo adduser backtesting
sudo usermod -aG sudo backtesting
su - backtesting

# 코드 배포
git clone <your-repo-url> /home/backtesting/app
cd /home/backtesting/app

# 가상환경 설정
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Nginx 설정

```bash
# /etc/nginx/sites-available/backtesting-api 생성
sudo nano /etc/nginx/sites-available/backtesting-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Nginx 설정 활성화
sudo ln -s /etc/nginx/sites-available/backtesting-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL 인증서 설정 (Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

### 4. 프로세스 관리 (Gunicorn + Supervisor)

```bash
# Gunicorn 설치
pip install gunicorn

# Supervisor 설치
sudo apt install supervisor -y

# /etc/supervisor/conf.d/backtesting-api.conf 생성
sudo nano /etc/supervisor/conf.d/backtesting-api.conf
```

```ini
[program:backtesting-api]
command=/home/backtesting/app/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:8000
directory=/home/backtesting/app
user=backtesting
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/backtesting-api.log
```

```bash
# Supervisor 재시작
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start backtesting-api
sudo supervisorctl status
```

## 🔧 환경 설정

### 환경 변수 (.env 파일)

```bash
# api_server/.env 생성
nano .env
```

```env
# 서버 설정
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# 데이터 설정
DATA_CACHE_HOURS=24
MAX_BACKTEST_DURATION_DAYS=3650

# CORS 설정
BACKEND_CORS_ORIGINS=["https://your-frontend.com"]
```

### 프로덕션 최적화

```python
# app/core/config.py 수정
class Settings(BaseSettings):
    debug: bool = False
    workers: int = 4
    max_concurrent_requests: int = 100
    
    # 캐싱 설정
    redis_url: Optional[str] = None
    
    # 모니터링
    sentry_dsn: Optional[str] = None
```

## 📊 모니터링 및 로깅

### 1. 로그 설정

```bash
# 로그 디렉터리 생성
sudo mkdir -p /var/log/backtesting-api
sudo chown backtesting:backtesting /var/log/backtesting-api

# 로그 로테이션 설정
sudo nano /etc/logrotate.d/backtesting-api
```

```
/var/log/backtesting-api/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

### 2. 모니터링 스크립트

```bash
#!/bin/bash
# health_check.sh
HEALTH_URL="http://localhost:8000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API is unhealthy (HTTP: $RESPONSE)"
    # 알림 전송 또는 재시작 로직
    sudo systemctl restart backtesting-api
    exit 1
fi
```

```bash
# Cron 등록 (5분마다 헬스체크)
crontab -e
# */5 * * * * /home/backtesting/health_check.sh
```

## 🔐 보안 설정

### 1. API Rate Limiting

```python
# requirements.txt에 추가
slowapi==0.1.9

# app/main.py에 추가
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/backtest/run")
@limiter.limit("10/minute")
async def run_backtest(request: Request, backtest_request: BacktestRequest):
    # ...
```

### 2. HTTPS 강제

```nginx
# Nginx 설정에 추가
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🚀 성능 최적화

### 1. Redis 캐싱

```bash
# Redis 설치
sudo apt install redis-server -y
pip install redis
```

### 2. 데이터베이스 연결

```python
# PostgreSQL for storing backtest results
pip install asyncpg sqlalchemy
```

## 📝 배포 체크리스트

- [ ] 독립적인 디렉터리 구조 구성
- [ ] requirements.txt 의존성 정리
- [ ] 환경 변수 설정
- [ ] Docker 이미지 빌드 테스트
- [ ] 보안 그룹/방화벽 설정
- [ ] SSL 인증서 설정
- [ ] 프로세스 관리 설정
- [ ] 로그 및 모니터링 설정
- [ ] 백업 전략 수립
- [ ] 헬스체크 및 알림 설정 