# Backtesting API 명세서

FastAPI 기반 백테스팅 API 서버의 상세 명세입니다.

## Base URL

```
http://localhost:8000/api/v1
```

## 데이터 소스

- **Yahoo Finance**: 주식 가격 데이터 제공
- **지원 티커**: 대부분의 미국 주식, ETF, 주요 국제 주식
- **데이터 기간**: 1970년대부터 현재까지 (티커별로 상이)
- **업데이트**: 실시간 (시장 개장 시간 기준)

## 인증

현재 버전에서는 인증이 필요하지 않습니다.

## 응답 형식

모든 API 응답은 JSON 형식이며, 성공 시 HTTP 상태 코드 200을 반환합니다.

## 에러 처리

- **400 Bad Request**: 잘못된 요청 파라미터
- **404 Not Found**: 리소스를 찾을 수 없음
- **500 Internal Server Error**: 서버 내부 오류
- **503 Service Unavailable**: 서비스 이용 불가

---

## 1. 백테스팅 API

### 1.1 백테스트 실행

주어진 전략과 파라미터로 백테스트를 실행합니다.

**Endpoint:** `POST /backtest/run`

**Request Body:**
```json
{
  "ticker": "AAPL",
  "start_date": "2020-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000.0,
  "strategy": "sma_crossover",
  "strategy_params": {
    "short_window": 10,
    "long_window": 20
  },
  "commission": 0.002,
  "spread": 0.0
}
```

**Request Parameters:**
- `ticker` (string, required): 주식 티커 심볼 (예: AAPL, GOOGL)
- `start_date` (string, required): 백테스트 시작 날짜 (YYYY-MM-DD)
- `end_date` (string, required): 백테스트 종료 날짜 (YYYY-MM-DD)
- `initial_cash` (number, optional): 초기 투자금액 (기본값: 10000.0)
- `strategy` (string, required): 전략명 (sma_crossover, rsi_strategy, bollinger_bands, macd_strategy, buy_and_hold)
- `strategy_params` (object, optional): 전략별 파라미터 (기본값: 각 전략의 기본 파라미터 사용)
- `commission` (number, optional): 거래 수수료 (기본값: 0.002)
- `spread` (number, optional): 스프레드 (기본값: 0.0)

**Strategy Parameters 상세 설명:**
- `strategy_params`를 생략하면 각 전략의 기본 파라미터가 자동으로 적용됩니다
- 일부 파라미터만 지정해도 나머지는 기본값이 사용됩니다
- 잘못된 파라미터나 범위를 벗어난 값은 400 에러를 반환합니다

**Response:**
```json
{
  "ticker": "AAPL",
  "strategy": "sma_crossover",
  "start_date": "2020-01-01",
  "end_date": "2023-12-31",
  "duration_days": 1460,
  "initial_cash": 10000.0,
  "final_equity": 18543.75,
  "total_return_pct": 85.44,
  "annualized_return_pct": 18.25,
  "buy_and_hold_return_pct": 127.45,
  "cagr_pct": 17.95,
  "volatility_pct": 28.45,
  "sharpe_ratio": 0.64,
  "sortino_ratio": 0.89,
  "calmar_ratio": 0.42,
  "max_drawdown_pct": -42.85,
  "avg_drawdown_pct": -12.45,
  "total_trades": 23,
  "win_rate_pct": 52.2,
  "profit_factor": 1.18,
  "avg_trade_pct": 2.8,
  "best_trade_pct": 15.2,
  "worst_trade_pct": -8.9,
  "alpha_pct": -8.5,
  "beta": 0.82,
  "kelly_criterion": 0.08,
  "sqn": 0.95,
  "execution_time_seconds": 1.84,
  "timestamp": "2025-05-29T12:30:45.123456"
}
```

### 1.2 백테스트 서비스 상태 확인

백테스트 서비스의 상태를 확인합니다.

**Endpoint:** `GET /backtest/health`

**Response:**
```json
{
  "status": "healthy",
  "message": "백테스트 서비스가 정상 작동 중입니다.",
  "data_source": "Yahoo Finance 연결 정상"
}
```

---

## 2. 전략 관리 API

### 2.1 전략 목록 조회

사용 가능한 모든 백테스팅 전략의 목록과 정보를 반환합니다.

**Endpoint:** `GET /strategies/`

**Response:**
```json
{
  "strategies": [
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
    },
    {
      "name": "rsi_strategy",
      "description": "RSI 과매수/과매도 기반 전략",
      "parameters": {
        "rsi_period": {
          "type": "int",
          "default": 14,
          "min": 5,
          "max": 50,
          "description": "RSI 계산 기간"
        },
        "rsi_upper": {
          "type": "float",
          "default": 70,
          "min": 50,
          "max": 90,
          "description": "과매수 임계값"
        },
        "rsi_lower": {
          "type": "float",
          "default": 30,
          "min": 10,
          "max": 50,
          "description": "과매도 임계값"
        }
      }
    }
  ],
  "total_count": 5
}
```

### 2.2 특정 전략 정보 조회

지정된 전략의 상세 정보를 반환합니다.

**Endpoint:** `GET /strategies/{strategy_name}`

**Path Parameters:**
- `strategy_name` (string): 조회할 전략명

**Response:**
```json
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
```

### 2.3 전략 파라미터 유효성 검증

주어진 파라미터가 전략에 유효한지 검증합니다.

**Endpoint:** `GET /strategies/{strategy_name}/validate`

**Path Parameters:**
- `strategy_name` (string): 검증할 전략명

**Query Parameters:**
전략별 파라미터들을 쿼리 파라미터로 전달

**Example:** `GET /strategies/sma_crossover/validate?short_window=10&long_window=20`

**Response:**
```json
{
  "strategy": "sma_crossover",
  "is_valid": true,
  "validated_params": {
    "short_window": 10,
    "long_window": 20
  },
  "message": "파라미터가 유효합니다."
}
```

---

## 3. 최적화 API

### 3.1 파라미터 최적화 실행

주어진 전략의 파라미터를 최적화하여 최고 성능을 찾습니다.

**Endpoint:** `POST /optimize/run`

**Request Body:**
```json
{
  "ticker": "AAPL",
  "start_date": "2020-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000.0,
  "strategy": "sma_crossover",
  "param_ranges": {
    "short_window": [5, 15],
    "long_window": [20, 50]
  },
  "method": "grid",
  "maximize": "SQN",
  "max_tries": 100,
  "commission": 0.002
}
```

**Request Parameters:**
- `ticker` (string, required): 주식 티커 심볼
- `start_date` (string, required): 백테스트 시작 날짜 (YYYY-MM-DD)
- `end_date` (string, required): 백테스트 종료 날짜 (YYYY-MM-DD)
- `initial_cash` (number, optional): 초기 투자금액 (기본값: 10000.0)
- `strategy` (string, required): 최적화할 전략명
- `param_ranges` (object, required): 파라미터별 최적화 범위 [min, max]
- `method` (string, optional): 최적화 방법 ("grid" 또는 "sambo", 기본값: "grid")
- `maximize` (string, optional): 최적화할 지표 (기본값: "SQN")
- `max_tries` (number, optional): 최대 시도 횟수 (기본값: 100)
- `commission` (number, optional): 거래 수수료 (기본값: 0.002)

**Response:**
```json
{
  "ticker": "AAPL",
  "strategy": "sma_crossover",
  "method": "grid",
  "total_iterations": 100,
  "best_params": {
    "short_window": 8,
    "long_window": 25
  },
  "best_score": 2.15,
  "optimization_target": "SQN",
  "backtest_result": {
    "ticker": "AAPL",
    "strategy": "sma_crossover",
    "total_return_pct": 65.8,
    "sharpe_ratio": 0.72,
    "max_drawdown_pct": -18.5
  },
  "execution_time_seconds": 45.2,
  "timestamp": "2024-01-15T10:45:00"
}
```

### 3.2 최적화 대상 지표 목록

최적화 대상으로 사용할 수 있는 성능 지표들의 목록을 반환합니다.

**Endpoint:** `GET /optimize/targets`

**Response:**
```json
{
  "targets": {
    "SQN": {
      "name": "System Quality Number",
      "description": "시스템 품질 지수 - 전략의 전반적 품질을 나타냄",
      "higher_better": true
    },
    "Return [%]": {
      "name": "Total Return",
      "description": "총 수익률",
      "higher_better": true
    },
    "Sharpe Ratio": {
      "name": "Sharpe Ratio",
      "description": "샤프 비율 - 위험 대비 수익률",
      "higher_better": true
    },
    "Max. Drawdown [%]": {
      "name": "Maximum Drawdown",
      "description": "최대 손실률 (음수)",
      "higher_better": false
    }
  },
  "default": "SQN",
  "recommended": ["SQN", "Sharpe Ratio", "Calmar Ratio"]
}
```

### 3.3 최적화 방법 목록

파라미터 최적화에 사용할 수 있는 방법들의 목록을 반환합니다.

**Endpoint:** `GET /optimize/methods`

**Response:**
```json
{
  "methods": {
    "grid": {
      "name": "Grid Search",
      "description": "격자 탐색 - 모든 파라미터 조합을 체계적으로 테스트",
      "pros": ["완전 탐색", "재현 가능", "이해하기 쉬움"],
      "cons": ["계산 시간이 많이 소요", "파라미터 개수에 민감"],
      "best_for": "파라미터 개수가 적고 정확한 결과가 필요한 경우"
    },
    "sambo": {
      "name": "SAMBO Optimization",
      "description": "모델 기반 최적화 - 베이지안 최적화 알고리즘",
      "pros": ["빠른 수렴", "효율적", "고차원 파라미터 처리 가능"],
      "cons": ["확률적 결과", "복잡한 알고리즘"],
      "best_for": "파라미터 개수가 많거나 빠른 결과가 필요한 경우"
    }
  },
  "default": "grid",
  "recommended": "sambo"
}
```

---

## 4. 시스템 API

### 4.1 헬스체크

서버와 주요 서비스들의 상태를 확인합니다.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

---

## 5. 사용 가능한 전략

### 5.1 SMA Crossover (sma_crossover)
단순 이동평균 교차 전략

**파라미터:**
- `short_window` (int): 단기 이동평균 기간 (5-50, 기본값: 10)
- `long_window` (int): 장기 이동평균 기간 (10-200, 기본값: 20)

### 5.2 RSI Strategy (rsi_strategy)
RSI 과매수/과매도 기반 전략

**파라미터:**
- `rsi_period` (int): RSI 계산 기간 (5-50, 기본값: 14)
- `rsi_upper` (float): 과매수 임계값 (50-90, 기본값: 70)
- `rsi_lower` (float): 과매도 임계값 (10-50, 기본값: 30)

### 5.3 Bollinger Bands (bollinger_bands)
볼린저 밴드 기반 전략

**파라미터:**
- `period` (int): 이동평균 기간 (10-50, 기본값: 20)
- `std_dev` (float): 표준편차 배수 (1.0-3.0, 기본값: 2.0)

### 5.4 MACD Strategy (macd_strategy)
MACD 교차 기반 전략

**파라미터:**
- `fast_period` (int): 빠른 EMA 기간 (5-20, 기본값: 12)
- `slow_period` (int): 느린 EMA 기간 (20-50, 기본값: 26)
- `signal_period` (int): 시그널 라인 기간 (5-15, 기본값: 9)

### 5.5 Buy and Hold (buy_and_hold)
매수 후 보유 전략

**파라미터:** 없음

---

## 6. 예시 코드

### Python requests를 사용한 백테스트 실행

```python
import requests
import json

# 백테스트 실행 (기본 파라미터 사용)
url = "http://localhost:8000/api/v1/backtest/run"
data = {
    "ticker": "AAPL",
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "initial_cash": 10000,
    "strategy": "sma_crossover"
}

response = requests.post(url, json=data)
result = response.json()
print(f"Total Return: {result['total_return_pct']:.2f}%")
print(f"Sharpe Ratio: {result['sharpe_ratio']:.3f}")

# 커스텀 파라미터로 백테스트 실행
data_custom = {
    "ticker": "AAPL", 
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "initial_cash": 10000,
    "strategy": "sma_crossover",
    "strategy_params": {
        "short_window": 5,
        "long_window": 25
    }
}

response = requests.post(url, json=data_custom)
result = response.json()
print(f"Custom Strategy Return: {result['total_return_pct']:.2f}%")
```

### curl을 사용한 전략 목록 조회

```bash
curl -X GET "http://localhost:8000/api/v1/strategies/" \
     -H "Accept: application/json"
```

### JavaScript fetch를 사용한 최적화

```javascript
const optimizeStrategy = async () => {
  const response = await fetch('http://localhost:8000/api/v1/optimize/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticker: 'AAPL',
      start_date: '2020-01-01',
      end_date: '2023-12-31',
      initial_cash: 10000,
      strategy: 'sma_crossover',
      param_ranges: {
        short_window: [5, 15],
        long_window: [20, 50]
      },
      method: 'grid'
    })
  });
  
  const result = await response.json();
  console.log('Best parameters:', result.best_params);
  console.log('Best score:', result.best_score);
};
```

---

## 7. 에러 응답 예시

### 400 Bad Request - 잘못된 날짜 범위
```json
{
  "detail": "종료 날짜는 시작 날짜보다 이후여야 합니다"
}
```

### 400 Bad Request - 파라미터 범위 오류
```json
{
  "detail": "short_window의 값 3는 최소값 5보다 작습니다"
}
```

### 400 Bad Request - 데이터 수집 실패
```json
{
  "detail": "데이터 수집 실패: INVALID_TICKER - 티커 'INVALID_TICKER'에 대한 데이터를 찾을 수 없습니다"
}
```

### 404 Not Found
```json
{
  "detail": "지원하지 않는 전략: invalid_strategy"
}
```

### 500 Internal Server Error
```json
{
  "detail": "백테스트 실행 중 오류가 발생했습니다."
}
```

### 503 Service Unavailable
```json
{
  "detail": "데이터 소스 연결에 문제가 있습니다."
}
```
