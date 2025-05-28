# 백테스팅 API 명세서

## 📋 개요

백테스팅 API는 주식 투자 전략의 과거 성과를 분석하기 위한 RESTful API입니다. 다양한 기술적 분석 전략을 지원하며, 차트 데이터와 성과 지표를 제공합니다.

## 🌐 기본 정보

- **Base URL**: `http://localhost:8000`
- **API Version**: `v1`
- **Content-Type**: `application/json`
- **Authentication**: 현재 인증 없음 (개발용)

## 📊 응답 형식

### 성공 응답
```json
{
  "status": "success",
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다."
}
```

### 오류 응답
```json
{
  "detail": "오류 메시지",
  "status_code": 400
}
```

## 🚀 API 엔드포인트

### 🏥 시스템 API

#### `GET /health`
전체 시스템 상태 확인

**응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

**상태 코드:**
- `200 OK`: 시스템 정상
- `503 Service Unavailable`: 서비스 불가

---

## 🔬 백테스팅 API (`/api/v1/backtest`)

### `POST /api/v1/backtest/run`
백테스트 실행

**파라미터:**

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `ticker` | string | ✅ | 주식 티커 심볼 | `"AAPL"` |
| `start_date` | string | ✅ | 시작 날짜 (YYYY-MM-DD) | `"2023-01-01"` |
| `end_date` | string | ✅ | 종료 날짜 (YYYY-MM-DD) | `"2023-12-31"` |
| `initial_cash` | number | ✅ | 초기 투자금 ($) | `10000` |
| `strategy` | string | ✅ | 전략명 | `"buy_and_hold"` |
| `strategy_params` | object | ❌ | 전략별 파라미터 | `{"short_window": 10}` |
| `commission` | number | ❌ | 거래 수수료 (기본: 0.002) | `0.001` |

**요청 예시:**
```json
{
  "ticker": "AAPL",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000,
  "strategy": "sma_crossover",
  "strategy_params": {
    "short_window": 10,
    "long_window": 20
  },
  "commission": 0.002
}
```

**응답 예시:**
```json
{
  "ticker": "AAPL",
  "strategy": "sma_crossover",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_cash": 10000,
  "final_value": 15480.32,
  "total_return_pct": 54.80,
  "annual_return_pct": 54.80,
  "total_trades": 47,
  "win_rate_pct": 63.8,
  "max_drawdown_pct": -12.45,
  "sharpe_ratio": 1.234,
  "sortino_ratio": 1.567,
  "calmar_ratio": 4.401,
  "profit_factor": 2.45,
  "buy_and_hold_return_pct": 54.80,
  "alpha": 0.05,
  "beta": 1.02,
  "duration_days": 365,
  "cagr_pct": 54.80,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**상태 코드:**
- `200 OK`: 백테스트 성공
- `400 Bad Request`: 잘못된 파라미터
- `500 Internal Server Error`: 백테스트 실행 오류

### `POST /api/v1/backtest/chart-data`
차트용 데이터 생성 (React/Recharts 호환)

**파라미터:** 동일 (`/run`과 같음)

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
      "size": 79.96,
      "pnl_pct": 0.0
    }
  ],
  "indicators": [
    {
      "name": "SMA_20",
      "color": "#ff7300",
      "data": [
        {
          "date": "2023-01-23",
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

**차트 데이터 설명:**

| 필드 | 설명 | 용도 |
|------|------|------|
| `ohlc_data` | OHLC + 거래량 데이터 | 캔들스틱/라인 차트 |
| `equity_data` | 자산 곡선 데이터 | 수익률/드로우다운 차트 |
| `trade_markers` | 거래 시점 표시 | 산점도/마커 차트 |
| `indicators` | 기술 지표 데이터 | 추가 라인 차트 |
| `summary_stats` | 요약 통계 | 지표 카드/테이블 |

### `GET /api/v1/backtest/health`
백테스트 서비스 상태 확인

**응답 예시:**
```json
{
  "status": "healthy",
  "message": "백테스트 서비스가 정상 작동 중입니다.",
  "data_source": "Yahoo Finance 연결 정상"
}
```

---

## 📈 전략 관리 API (`/api/v1/strategies`)

### `GET /api/v1/strategies/`
사용 가능한 전략 목록 조회

**응답 예시:**
```json
{
  "strategies": [
    {
      "name": "buy_and_hold",
      "description": "매수 후 보유 전략 - 단순히 주식을 매수하여 보유",
      "parameters": {}
    },
    {
      "name": "sma_crossover",
      "description": "단순 이동평균 교차 전략 - 단기/장기 이동평균 교차로 매매",
      "parameters": {
        "short_window": {
          "type": "int",
          "default": 10,
          "min": 5,
          "max": 50,
          "description": "단기 이동평균 기간 (일)"
        },
        "long_window": {
          "type": "int", 
          "default": 20,
          "min": 10,
          "max": 200,
          "description": "장기 이동평균 기간 (일)"
        }
      }
    },
    {
      "name": "rsi_strategy",
      "description": "RSI 전략 - 과매수/과매도 구간에서 매매",
      "parameters": {
        "rsi_period": {
          "type": "int",
          "default": 14,
          "min": 5,
          "max": 50,
          "description": "RSI 계산 기간 (일)"
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
    },
    {
      "name": "bollinger_bands",
      "description": "볼린저 밴드 전략 - 밴드 상/하단 돌파로 매매",
      "parameters": {
        "period": {
          "type": "int",
          "default": 20,
          "min": 10,
          "max": 50,
          "description": "이동평균 기간 (일)"
        },
        "std_dev": {
          "type": "float",
          "default": 2.0,
          "min": 1.0,
          "max": 3.0,
          "description": "표준편차 배수"
        }
      }
    },
    {
      "name": "macd_strategy",
      "description": "MACD 전략 - MACD 라인 교차로 매매",
      "parameters": {
        "fast_period": {
          "type": "int",
          "default": 12,
          "min": 5,
          "max": 20,
          "description": "빠른 EMA 기간 (일)"
        },
        "slow_period": {
          "type": "int",
          "default": 26,
          "min": 20,
          "max": 50,
          "description": "느린 EMA 기간 (일)"
        },
        "signal_period": {
          "type": "int",
          "default": 9,
          "min": 5,
          "max": 15,
          "description": "시그널 라인 기간 (일)"
        }
      }
    }
  ],
  "total_count": 5
}
```

### `GET /api/v1/strategies/{strategy_name}`
특정 전략 정보 조회

**Path Parameters:**
- `strategy_name`: 조회할 전략명

**응답 예시:**
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

**상태 코드:**
- `200 OK`: 전략 정보 조회 성공
- `404 Not Found`: 존재하지 않는 전략

### `GET /api/v1/strategies/{strategy_name}/validate`
전략 파라미터 유효성 검증

**Path Parameters:**
- `strategy_name`: 검증할 전략명

**Query Parameters:**
전략별 파라미터들 (예: `?short_window=10&long_window=20`)

**응답 예시 (성공):**
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

**응답 예시 (실패):**
```json
{
  "strategy": "sma_crossover",
  "is_valid": false,
  "error": "short_window 값이 long_window보다 크거나 같을 수 없습니다.",
  "message": "파라미터 검증에 실패했습니다."
}
```

---

## ⚙️ 최적화 API (`/api/v1/optimize`)

### `POST /api/v1/optimize/run`
전략 파라미터 최적화 실행

**파라미터:**

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `ticker` | string | ✅ | 주식 티커 심볼 | `"AAPL"` |
| `start_date` | string | ✅ | 시작 날짜 | `"2023-01-01"` |
| `end_date` | string | ✅ | 종료 날짜 | `"2023-12-31"` |
| `initial_cash` | number | ✅ | 초기 투자금 | `10000` |
| `strategy` | string | ✅ | 최적화할 전략명 | `"sma_crossover"` |
| `param_ranges` | object | ✅ | 파라미터별 최적화 범위 | `{"short_window": [5,15]}` |
| `method` | string | ❌ | 최적화 방법 (기본: "grid") | `"grid"` 또는 `"sambo"` |
| `maximize` | string | ❌ | 최적화 대상 지표 (기본: "SQN") | `"SQN"` |
| `max_tries` | number | ❌ | 최대 시도 횟수 (기본: 100) | `200` |

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
  "maximize": "Sharpe Ratio",
  "max_tries": 100
}
```

**응답 예시:**
```json
{
  "ticker": "AAPL",
  "strategy": "sma_crossover",
  "optimization_target": "Sharpe Ratio",
  "optimization_method": "grid",
  "best_params": {
    "short_window": 8,
    "long_window": 25
  },
  "best_result": {
    "sharpe_ratio": 1.845,
    "total_return_pct": 67.32,
    "max_drawdown_pct": -8.45,
    "total_trades": 23,
    "win_rate_pct": 69.6
  },
  "optimization_history": [
    {
      "params": {"short_window": 5, "long_window": 20},
      "result": {"sharpe_ratio": 1.234, "total_return_pct": 45.67}
    }
  ],
  "total_combinations_tested": 66,
  "execution_time_seconds": 45.6
}
```

### `GET /api/v1/optimize/targets`
최적화 가능한 지표 목록 조회

**응답 예시:**
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
    "Sortino Ratio": {
      "name": "Sortino Ratio",
      "description": "소르티노 비율 - 하방 위험 대비 수익률",
      "higher_better": true
    },
    "Calmar Ratio": {
      "name": "Calmar Ratio",
      "description": "칼마 비율 - 최대 손실 대비 연간 수익률",
      "higher_better": true
    },
    "Profit Factor": {
      "name": "Profit Factor",
      "description": "수익 팩터 - 총 이익 대비 총 손실",
      "higher_better": true
    },
    "Win Rate [%]": {
      "name": "Win Rate",
      "description": "승률 - 수익 거래 비율",
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

### `GET /api/v1/optimize/methods`
사용 가능한 최적화 방법 목록 조회

**응답 예시:**
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

## 🛠️ 클라이언트 예시

### Python 클라이언트

```python
import requests
import json
from datetime import datetime, timedelta

class BacktestClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        
    def run_backtest(self, ticker, strategy, start_date, end_date, 
                     initial_cash=10000, strategy_params=None):
        """백테스트 실행"""
        url = f"{self.base_url}/api/v1/backtest/run"
        
        payload = {
            "ticker": ticker,
            "start_date": start_date,
            "end_date": end_date,
            "initial_cash": initial_cash,
            "strategy": strategy,
            "strategy_params": strategy_params or {}
        }
        
        response = requests.post(url, json=payload)
        return response.json()
    
    def get_chart_data(self, ticker, strategy, start_date, end_date,
                       initial_cash=10000, strategy_params=None):
        """차트 데이터 조회"""
        url = f"{self.base_url}/api/v1/backtest/chart-data"
        
        payload = {
            "ticker": ticker,
            "start_date": start_date,
            "end_date": end_date,
            "initial_cash": initial_cash,
            "strategy": strategy,
            "strategy_params": strategy_params or {}
        }
        
        response = requests.post(url, json=payload)
        return response.json()
    
    def get_strategies(self):
        """전략 목록 조회"""
        url = f"{self.base_url}/api/v1/strategies/"
        response = requests.get(url)
        return response.json()
    
    def optimize_strategy(self, ticker, strategy, param_ranges, 
                         start_date, end_date, method="grid"):
        """파라미터 최적화"""
        url = f"{self.base_url}/api/v1/optimize/run"
        
        payload = {
            "ticker": ticker,
            "start_date": start_date,
            "end_date": end_date,
            "strategy": strategy,
            "param_ranges": param_ranges,
            "method": method
        }
        
        response = requests.post(url, json=payload)
        return response.json()

# 사용 예시
client = BacktestClient()

# 1. 백테스트 실행
result = client.run_backtest(
    ticker="AAPL",
    strategy="sma_crossover",
    start_date="2023-01-01",
    end_date="2023-12-31",
    strategy_params={"short_window": 10, "long_window": 20}
)
print(f"수익률: {result['total_return_pct']:.2f}%")

# 2. 차트 데이터 조회
chart_data = client.get_chart_data(
    ticker="AAPL",
    strategy="buy_and_hold",
    start_date="2023-01-01",
    end_date="2023-12-31"
)
print(f"OHLC 데이터 포인트: {len(chart_data['ohlc_data'])}")

# 3. 전략 목록 조회
strategies = client.get_strategies()
print(f"사용 가능한 전략: {len(strategies['strategies'])}개")

# 4. 파라미터 최적화
optimization = client.optimize_strategy(
    ticker="AAPL",
    strategy="sma_crossover",
    param_ranges={
        "short_window": [5, 15],
        "long_window": [20, 50]
    },
    start_date="2023-01-01",
    end_date="2023-12-31"
)
print(f"최적 파라미터: {optimization['best_params']}")
```

### JavaScript/React 클라이언트

```javascript
class BacktestAPI {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async runBacktest(params) {
    const response = await fetch(`${this.baseUrl}/api/v1/backtest/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getChartData(params) {
    const response = await fetch(`${this.baseUrl}/api/v1/backtest/chart-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    return response.json();
  }

  async getStrategies() {
    const response = await fetch(`${this.baseUrl}/api/v1/strategies/`);
    return response.json();
  }

  async optimizeStrategy(params) {
    const response = await fetch(`${this.baseUrl}/api/v1/optimize/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    return response.json();
  }
}

// 사용 예시
const api = new BacktestAPI();

// React 컴포넌트에서 사용
const BacktestComponent = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const result = await api.getChartData({
        ticker: 'AAPL',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        initial_cash: 10000,
        strategy: 'buy_and_hold'
      });
      setChartData(result);
    } catch (error) {
      console.error('백테스트 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runBacktest} disabled={loading}>
        {loading ? '실행 중...' : '백테스트 실행'}
      </button>
      
      {chartData && (
        <LineChart data={chartData.equity_data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Line dataKey="return_pct" stroke="#8884d8" />
        </LineChart>
      )}
    </div>
  );
};
```

## 🚨 오류 코드

| 상태 코드 | 설명 | 원인 | 해결 방법 |
|-----------|------|------|-----------|
| `400` | Bad Request | 잘못된 파라미터 | 요청 파라미터 확인 |
| `404` | Not Found | 존재하지 않는 리소스 | URL 및 전략명 확인 |
| `422` | Validation Error | 데이터 형식 오류 | 데이터 타입 및 범위 확인 |
| `500` | Internal Server Error | 서버 내부 오류 | 서버 로그 확인 |
| `503` | Service Unavailable | 서비스 불가 | 데이터 소스 연결 확인 |

## 📝 제한사항

- **백테스트 기간**: 최소 30일, 최대 10년
- **동시 요청**: 개발 환경에서는 제한 없음
- **데이터 소스**: Yahoo Finance (무료 서비스 제한 적용)
- **티커 지원**: 미국 주식 시장 (NYSE, NASDAQ)
- **캐시 유효기간**: 24시간

## 🔒 보안 고려사항

현재 개발 환경에서는 인증이 없지만, 프로덕션 환경에서는 다음을 고려해야 합니다:

- API 키 기반 인증
- 요청 속도 제한 (Rate Limiting)
- CORS 정책 강화
- HTTPS 강제 사용
- 입력 데이터 검증 강화

---

**참고**: 이 API는 교육 및 연구 목적으로 설계되었습니다. 실제 투자 결정에 사용하기 전에 충분한 검토와 추가 분석이 필요합니다.
