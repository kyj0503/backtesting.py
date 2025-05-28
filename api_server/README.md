# 백테스팅 API 서버

## 📋 개요

이 프로젝트는 주식 투자 전략의 백테스팅을 위한 FastAPI 기반 REST API 서버입니다. 다양한 기술적 분석 전략을 지원하며, 실시간 차트 데이터와 성과 분석 기능을 제공합니다.

## ✨ 주요 기능

### 🔬 백테스팅
- **다중 전략 지원**: Buy & Hold, SMA Crossover, RSI, Bollinger Bands, MACD
- **실시간 데이터**: Yahoo Finance API를 통한 최신 주가 데이터
- **상세 성과 분석**: 수익률, 드로우다운, 샤프 비율, 승률 등
- **차트 데이터**: React/Recharts 호환 JSON 형태 출력

### ⚙️ 파라미터 최적화
- **Grid Search**: 전체 파라미터 조합 탐색
- **SAMBO**: 베이지안 최적화를 통한 효율적 탐색
- **다양한 목표 지표**: SQN, Sharpe Ratio, Return 등

### 📊 시각화 지원
- **OHLC 캔들스틱 차트**: 가격 및 거래량 데이터
- **자산 곡선**: 누적 수익률과 드로우다운
- **거래 마커**: 매수/매도 시점 표시
- **기술 지표**: SMA, RSI, Bollinger Bands, MACD

## 🚀 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd api_server

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 설정

```bash
# 환경변수 파일 복사 및 설정
cp env.example .env

# .env 파일 편집
# LOG_LEVEL=INFO
# DEBUG=true
# HOST=0.0.0.0
# PORT=8000
```

### 3. 서버 실행

```bash
# 개발 모드 (자동 재시작)
python run_server.py

# 또는 uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API 문서 확인

서버 실행 후 브라우저에서 다음 URL로 접속:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## 📚 API 엔드포인트

### 🔬 백테스팅 API (`/api/v1/backtest`)

#### `POST /api/v1/backtest/run`
기본 백테스트 실행

**요청 예시:**
```json
{
  "ticker": "AAPL",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000,
  "strategy": "buy_and_hold",
  "strategy_params": {},
  "commission": 0.002
}
```

**응답 예시:**
```json
{
  "ticker": "AAPL",
  "strategy": "buy_and_hold",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000,
  "final_value": 15480.32,
  "total_return_pct": 54.80,
  "total_trades": 1,
  "win_rate_pct": 100.0,
  "max_drawdown_pct": -12.45,
  "sharpe_ratio": 1.234,
  "profit_factor": 2.45
}
```

#### `POST /api/v1/backtest/chart-data`
차트용 데이터 생성 (React/Recharts 호환)

**응답 구조:**
```json
{
  "ticker": "AAPL",
  "strategy": "buy_and_hold",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "ohlc_data": [
    {
      "date": "2023-01-03",
      "open": 130.28,
      "high": 130.90,
      "low": 124.17,
      "close": 125.07,
      "volume": 112117471
    }
  ],
  "equity_data": [
    {
      "date": "2023-01-03",
      "return_pct": 0.0,
      "drawdown_pct": 0.0
    }
  ],
  "trade_markers": [
    {
      "date": "2023-01-03",
      "type": "entry",
      "price": 125.07,
      "size": 79.96
    }
  ],
  "indicators": [
    {
      "name": "SMA_20",
      "color": "#ff7300",
      "data": [
        {
          "date": "2023-01-03",
          "value": 127.45
        }
      ]
    }
  ],
  "summary_stats": {
    "total_return_pct": 54.80,
    "total_trades": 1,
    "win_rate_pct": 100.0,
    "max_drawdown_pct": -12.45,
    "sharpe_ratio": 1.234,
    "profit_factor": 2.45
  }
}
```

#### `GET /api/v1/backtest/health`
백테스트 서비스 상태 확인

### 📈 전략 관리 API (`/api/v1/strategies`)

#### `GET /api/v1/strategies/`
사용 가능한 전략 목록 조회

**응답 예시:**
```json
{
  "strategies": [
    {
      "name": "buy_and_hold",
      "description": "매수 후 보유 전략",
      "parameters": {}
    },
    {
      "name": "sma_crossover",
      "description": "단순 이동평균 교차 전략",
      "parameters": {
        "short_window": {
          "type": "int",
          "default": 10,
          "min": 5,
          "max": 50,
          "description": "단기 이동평균 기간"
        },
        "long_window": {
          "type": "int",
          "default": 20,
          "min": 10,
          "max": 200,
          "description": "장기 이동평균 기간"
        }
      }
    }
  ],
  "total_count": 5
}
```

#### `GET /api/v1/strategies/{strategy_name}`
특정 전략 정보 조회

#### `GET /api/v1/strategies/{strategy_name}/validate`
전략 파라미터 유효성 검증

### ⚙️ 최적화 API (`/api/v1/optimize`)

#### `POST /api/v1/optimize/run`
전략 파라미터 최적화 실행

**요청 예시:**
```json
{
  "ticker": "AAPL",
  "start_date": "2023-01-01", 
  "end_date": "2023-12-31",
  "initial_cash": 10000,
  "strategy": "sma_crossover",
  "param_ranges": {
    "short_window": [5, 15],
    "long_window": [20, 50]
  },
  "method": "grid",
  "maximize": "SQN",
  "max_tries": 100
}
```

#### `GET /api/v1/optimize/targets`
최적화 가능한 지표 목록 조회

#### `GET /api/v1/optimize/methods`
사용 가능한 최적화 방법 목록 조회

### 🏥 시스템 API

#### `GET /health`
전체 시스템 헬스체크

## 🎯 지원 전략

### 1. Buy & Hold (`buy_and_hold`)
- **설명**: 첫날 매수 후 마지막날까지 보유
- **파라미터**: 없음
- **특징**: 가장 단순한 벤치마크 전략

### 2. SMA Crossover (`sma_crossover`)
- **설명**: 단기/장기 이동평균 교차로 매매 신호 생성
- **파라미터**:
  - `short_window` (5-50): 단기 이동평균 기간
  - `long_window` (10-200): 장기 이동평균 기간

### 3. RSI Strategy (`rsi_strategy`)
- **설명**: RSI 지표로 과매수/과매도 구간에서 매매
- **파라미터**:
  - `rsi_period` (5-50): RSI 계산 기간
  - `rsi_upper` (50-90): 과매수 임계값
  - `rsi_lower` (10-50): 과매도 임계값

### 4. Bollinger Bands (`bollinger_bands`)
- **설명**: 볼린저 밴드 상/하단 돌파로 매매
- **파라미터**:
  - `period` (10-50): 이동평균 기간
  - `std_dev` (1.0-3.0): 표준편차 배수

### 5. MACD Strategy (`macd_strategy`)
- **설명**: MACD 라인 교차로 매매 신호 생성
- **파라미터**:
  - `fast_period` (5-20): 빠른 EMA 기간
  - `slow_period` (20-50): 느린 EMA 기간
  - `signal_period` (5-15): 시그널 라인 기간

## 📊 성과 지표

| 지표 | 설명 | 계산 방법 |
|------|------|-----------|
| **Total Return** | 총 수익률 | (최종값 - 초기값) / 초기값 × 100 |
| **Sharpe Ratio** | 샤프 비율 | (평균 수익률 - 무위험 수익률) / 수익률 표준편차 |
| **Sortino Ratio** | 소르티노 비율 | 평균 수익률 / 하방 변동성 |
| **Calmar Ratio** | 칼마 비율 | 연간 수익률 / 최대 드로우다운 |
| **Maximum Drawdown** | 최대 손실률 | 고점 대비 최대 하락폭 |
| **Win Rate** | 승률 | 수익 거래 수 / 전체 거래 수 × 100 |
| **Profit Factor** | 수익 팩터 | 총 이익 / 총 손실 |
| **SQN** | 시스템 품질 지수 | √거래수 × 평균P&L / P&L표준편차 |

## 🛠️ 사용 예시

### Python 클라이언트 예시

```python
import requests
import json

# 백테스트 실행
response = requests.post('http://localhost:8000/api/v1/backtest/run', 
    json={
        "ticker": "AAPL",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31", 
        "initial_cash": 10000,
        "strategy": "sma_crossover",
        "strategy_params": {
            "short_window": 10,
            "long_window": 20
        }
    }
)

result = response.json()
print(f"수익률: {result['total_return_pct']:.2f}%")
```

### JavaScript/React 예시

```javascript
// 차트 데이터 가져오기
const fetchChartData = async () => {
  const response = await fetch('/api/v1/backtest/chart-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticker: 'AAPL',
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      initial_cash: 10000,
      strategy: 'buy_and_hold'
    }),
  });
  
  const chartData = await response.json();
  
  // Recharts 차트 컴포넌트에서 사용
  return chartData;
};
```

### cURL 예시

```bash
# 백테스트 실행
curl -X POST "http://localhost:8000/api/v1/backtest/run" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "initial_cash": 10000,
    "strategy": "buy_and_hold"
  }'

# 전략 목록 조회
curl -X GET "http://localhost:8000/api/v1/strategies/"

# 시스템 상태 확인
curl -X GET "http://localhost:8000/health"
```

## 🐳 Docker 배포

### Docker 빌드 및 실행

```bash
# 이미지 빌드
docker build -t backtest-api .

# 컨테이너 실행
docker run -p 8000:8000 backtest-api
```

### Docker Compose 사용

```bash
# 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 🔧 개발 환경 설정

### 코드 품질 도구

```bash
# 코드 포맷팅
black app/
isort app/

# 테스트 실행
pytest

# 타입 검사
mypy app/
```

### 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `LOG_LEVEL` | 로그 레벨 | `INFO` |
| `DEBUG` | 디버그 모드 | `false` |
| `HOST` | 서버 호스트 | `0.0.0.0` |
| `PORT` | 서버 포트 | `8000` |
| `CORS_ORIGINS` | CORS 허용 도메인 | `["*"]` |

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 [Issues](../../issues) 페이지에서 문의해 주세요.

---

**주의사항**: 이 도구는 교육 및 연구 목적으로 제작되었습니다. 실제 투자 결정에 사용하기 전에 충분한 검토와 추가 분석이 필요합니다. 과거 성과가 미래 수익을 보장하지 않습니다. 