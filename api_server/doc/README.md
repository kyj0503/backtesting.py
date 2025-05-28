# Backtesting.py API Server

이 디렉토리는 Backtesting.py 라이브러리를 FastAPI 기반 REST API 서버로 제공하는 프로젝트입니다.

## 🚀 기능

- **백테스팅 API**: 티커, 투자금, 기간을 입력받아 백테스팅 결과 반환
- **전략 관리**: 사전 정의된 전략들을 API로 실행
- **결과 시각화**: 차트 이미지 생성 및 반환
- **파라미터 최적화**: API를 통한 전략 파라미터 최적화
- **자동 API 문서**: Swagger UI 및 ReDoc 지원

## 📁 디렉토리 구조

```
api_server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── backtest.py     # 백테스팅 엔드포인트
│   │   │   │   ├── strategies.py   # 전략 관련 엔드포인트
│   │   │   │   └── optimize.py     # 최적화 엔드포인트
│   │   │   └── api.py              # API 라우터 통합
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # 설정 관리
│   │   └── exceptions.py           # 커스텀 예외
│   ├── models/
│   │   ├── __init__.py
│   │   ├── requests.py             # 요청 모델
│   │   └── responses.py            # 응답 모델
│   ├── services/
│   │   ├── __init__.py
│   │   ├── backtest_service.py     # 백테스팅 비즈니스 로직
│   │   ├── data_service.py         # 데이터 수집 서비스
│   │   └── strategy_service.py     # 전략 관리 서비스
│   └── utils/
│       ├── __init__.py
│       ├── data_fetcher.py         # 외부 데이터 수집
│       └── plotting.py             # 차트 생성 유틸
├── doc/
│   ├── README.md                   # 이 파일
│   └── api.md                      # API 명세서
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── run_server.py
```

## 🛠 설치 및 실행

### 가상환경에서 의존성 설치 순서:

#### 1. 가상환경 활성화
```bash
.venv\Scripts\activate
```

#### 2. pip 및 빌드 도구 업그레이드 (선택사항, 하지만 권장)
```bash
python -m pip install --upgrade pip wheel setuptools
```

#### 3. backtesting.py 라이브러리 설치 (개발 모드)
```bash
pip install -e .
```

#### 4. FastAPI 서버 의존성 설치
```bash
cd api_server
pip install -r requirements.txt
```

**Pillow 설치 문제 해결:**
```bash
# 옵션 A: 미리 컴파일된 버전으로 설치
pip install --only-binary=Pillow Pillow

# 옵션 B: 필수 패키지만 개별 설치
pip install fastapi uvicorn[standard] pydantic pydantic-settings yfinance requests aiofiles structlog python-dotenv pytest pytest-asyncio python-multipart
```

#### 5. 서버 실행
```bash
# api_server 디렉토리에서
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는
python run_server.py
```

### Docker 실행

```bash
# Docker 컨테이너 빌드 및 실행
docker-compose up --build
```

## 📖 문서

### API 접근
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **헬스체크**: http://localhost:8000/health

### 상세 문서
- **[API 명세서](api.md)**: 모든 엔드포인트의 상세 스펙
- **사용 예시**: Python, JavaScript, curl 예제 코드

### 중요 정보
- **데이터 소스**: Yahoo Finance (무료)
- **데이터 캐싱**: 24시간 (성능 향상)
- **백테스트 기간 제한**: 최대 10년, 최소 30일
- **동시 요청 제한**: 별도 설정 없음 (개발용)

## 🎯 주요 API 엔드포인트

### 백테스팅
- `POST /api/v1/backtest/run` - 백테스트 실행
- `GET /api/v1/backtest/health` - 서비스 상태 확인

### 전략 관리  
- `GET /api/v1/strategies/` - 전략 목록 조회
- `GET /api/v1/strategies/{name}` - 특정 전략 정보
- `GET /api/v1/strategies/{name}/validate` - 파라미터 검증

### 최적화
- `POST /api/v1/optimize/run` - 파라미터 최적화
- `GET /api/v1/optimize/targets` - 최적화 대상 지표들
- `GET /api/v1/optimize/methods` - 최적화 방법들

## ⚡ 빠른 시작

### 1. 간단한 백테스트 실행

```bash
curl -X POST "http://localhost:8000/api/v1/backtest/run" \
     -H "Content-Type: application/json" \
     -d '{
       "ticker": "AAPL",
       "start_date": "2022-01-01", 
       "end_date": "2023-12-31",
       "initial_cash": 10000,
       "strategy": "sma_crossover"
     }'
```

### 2. 전략 목록 조회

```bash
curl -X GET "http://localhost:8000/api/v1/strategies/"
```

### 3. 파라미터 최적화

```bash
curl -X POST "http://localhost:8000/api/v1/optimize/run" \
     -H "Content-Type: application/json" \
     -d '{
       "ticker": "AAPL",
       "start_date": "2022-01-01",
       "end_date": "2023-12-31", 
       "initial_cash": 10000,
       "strategy": "sma_crossover",
       "param_ranges": {
         "short_window": [5, 15],
         "long_window": [20, 50]
       }
     }'
```

## 🔧 개발 가이드

### 새로운 전략 추가

1. `app/services/strategy_service.py`에 전략 클래스 추가
2. `_strategies` 딕셔너리에 전략 등록
3. 파라미터 정의 및 검증 로직 추가

### 새로운 데이터 소스 추가

1. `app/utils/data_fetcher.py`에 새로운 데이터 소스 함수 추가
2. `app/services/backtest_service.py`에서 새 소스 통합

### 테스트 실행

```bash
# 단위 테스트
python test_api.py

# 개별 컴포넌트 테스트
pytest app/tests/
```

## 🚀 지원 전략

- **SMA Crossover**: 단순 이동평균 교차 전략
- **RSI Strategy**: RSI 과매수/과매도 전략  
- **Bollinger Bands**: 볼린저 밴드 전략
- **MACD Strategy**: MACD 교차 전략
- **Buy and Hold**: 매수 후 보유 전략

각 전략의 상세 파라미터는 [API 명세서](api.md)를 참조하세요.

## 📊 성능 지표

30개 이상의 백테스팅 성과 지표를 제공합니다:
- 수익률 관련: 총 수익률, 연간 수익률, CAGR
- 위험 관련: 샤프 비율, 소르티노 비율, 최대 손실률
- 거래 관련: 총 거래수, 승률, 수익 팩터
- 고급 지표: 알파, 베타, 켈리 기준, SQN

## 🔧 문제 해결

### 일반적인 오류

**1. 데이터 수집 실패**
```json
{"detail": "데이터 수집 실패: TICKER - MultiIndex 오류"}
```
- **해결**: yfinance 라이브러리 업데이트 또는 다른 티커로 테스트

**2. 파라미터 범위 오류**
```json
{"detail": "short_window의 값 3는 최소값 5보다 작습니다"}
```
- **해결**: 각 전략의 파라미터 범위 확인 (`GET /strategies/{name}`)

**3. 짧은 데이터 기간**
- **증상**: 거래수가 매우 적거나 지표가 이상함
- **해결**: 최소 6개월 이상의 백테스트 기간 사용

### 성능 최적화

- **캐시 활용**: 동일한 티커/기간 조합은 캐시 사용
- **적절한 기간**: 1-3년 기간이 가장 안정적
- **파라미터 최적화**: Grid Search보다 SAMBO가 빠름

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add tests if necessary
5. Submit a pull request

## 📝 라이선스

이 프로젝트는 원본 Backtesting.py 라이브러리와 동일한 라이선스를 따릅니다. 