"""
API 응답 모델 정의
"""
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class BacktestResult(BaseModel):
    """백테스트 결과 모델"""
    # 기본 정보
    ticker: str = Field(..., description="티커 심볼")
    strategy: str = Field(..., description="사용된 전략")
    start_date: str = Field(..., description="백테스트 시작 날짜")
    end_date: str = Field(..., description="백테스트 종료 날짜")
    duration_days: int = Field(..., description="백테스트 기간 (일)")
    
    # 수익성 지표
    initial_cash: float = Field(..., description="초기 자본")
    final_equity: float = Field(..., description="최종 자본")
    total_return_pct: float = Field(..., description="총 수익률 (%)")
    annualized_return_pct: float = Field(..., description="연간 수익률 (%)")
    buy_and_hold_return_pct: float = Field(..., description="매수후보유 수익률 (%)")
    cagr_pct: float = Field(..., description="연복리성장률 (%)")
    
    # 위험 지표
    volatility_pct: float = Field(..., description="변동성 (%)")
    sharpe_ratio: float = Field(..., description="샤프 비율")
    sortino_ratio: float = Field(..., description="소르티노 비율")
    calmar_ratio: float = Field(..., description="칼마 비율")
    max_drawdown_pct: float = Field(..., description="최대 손실 (%)")
    avg_drawdown_pct: float = Field(..., description="평균 손실 (%)")
    
    # 거래 통계
    total_trades: int = Field(..., description="총 거래 수")
    win_rate_pct: float = Field(..., description="승률 (%)")
    profit_factor: float = Field(..., description="수익 팩터")
    avg_trade_pct: float = Field(..., description="평균 거래 수익률 (%)")
    best_trade_pct: float = Field(..., description="최고 거래 수익률 (%)")
    worst_trade_pct: float = Field(..., description="최악 거래 수익률 (%)")
    
    # 추가 지표
    alpha_pct: Optional[float] = Field(None, description="알파 (%)")
    beta: Optional[float] = Field(None, description="베타")
    kelly_criterion: Optional[float] = Field(None, description="켈리 기준")
    sqn: Optional[float] = Field(None, description="SQN")
    
    # 메타데이터
    execution_time_seconds: float = Field(..., description="실행 시간 (초)")
    timestamp: datetime = Field(..., description="결과 생성 시간")

    class Config:
        schema_extra = {
            "example": {
                "ticker": "AAPL",
                "strategy": "sma_crossover",
                "start_date": "2020-01-01",
                "end_date": "2023-12-31",
                "duration_days": 1461,
                "initial_cash": 10000.0,
                "final_equity": 15234.56,
                "total_return_pct": 52.35,
                "annualized_return_pct": 11.2,
                "buy_and_hold_return_pct": 78.4,
                "cagr_pct": 10.8,
                "volatility_pct": 23.4,
                "sharpe_ratio": 0.86,
                "sortino_ratio": 1.24,
                "calmar_ratio": 0.73,
                "max_drawdown_pct": -15.2,
                "avg_drawdown_pct": -3.1,
                "total_trades": 42,
                "win_rate_pct": 57.14,
                "profit_factor": 1.38,
                "avg_trade_pct": 1.2,
                "best_trade_pct": 8.9,
                "worst_trade_pct": -4.5,
                "alpha_pct": 2.1,
                "beta": 0.89,
                "kelly_criterion": 0.23,
                "sqn": 1.45,
                "execution_time_seconds": 2.34,
                "timestamp": "2024-01-15T10:30:00"
            }
        }


class OptimizationResult(BaseModel):
    """최적화 결과 모델"""
    ticker: str = Field(..., description="티커 심볼")
    strategy: str = Field(..., description="최적화된 전략")
    method: str = Field(..., description="사용된 최적화 방법")
    total_iterations: int = Field(..., description="총 반복 횟수")
    best_params: Dict[str, Any] = Field(..., description="최적 파라미터")
    best_score: float = Field(..., description="최적 점수")
    optimization_target: str = Field(..., description="최적화 대상 지표")
    
    # 최적 결과의 백테스트 통계
    backtest_result: BacktestResult = Field(..., description="최적 파라미터의 백테스트 결과")
    
    # 최적화 메타데이터
    execution_time_seconds: float = Field(..., description="최적화 실행 시간 (초)")
    timestamp: datetime = Field(..., description="최적화 완료 시간")

    class Config:
        schema_extra = {
            "example": {
                "ticker": "AAPL",
                "strategy": "sma_crossover",
                "method": "grid",
                "total_iterations": 100,
                "best_params": {
                    "short_window": 12,
                    "long_window": 26
                },
                "best_score": 1.68,
                "optimization_target": "SQN",
                "execution_time_seconds": 45.2,
                "timestamp": "2024-01-15T10:35:00"
            }
        }


class StrategyInfo(BaseModel):
    """전략 정보 모델"""
    name: str = Field(..., description="전략 이름")
    description: str = Field(..., description="전략 설명")
    parameters: Dict[str, Dict[str, Any]] = Field(..., description="전략 파라미터 정보")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "sma_crossover",
                "description": "Simple Moving Average Crossover Strategy",
                "parameters": {
                    "short_window": {
                        "type": "int",
                        "default": 10,
                        "min": 5,
                        "max": 50,
                        "description": "Short-term moving average period"
                    },
                    "long_window": {
                        "type": "int", 
                        "default": 20,
                        "min": 10,
                        "max": 200,
                        "description": "Long-term moving average period"
                    }
                }
            }
        }


class StrategyListResponse(BaseModel):
    """전략 목록 응답 모델"""
    strategies: List[StrategyInfo] = Field(..., description="사용 가능한 전략 목록")
    total_count: int = Field(..., description="총 전략 개수")


class ErrorResponse(BaseModel):
    """에러 응답 모델"""
    error: str = Field(..., description="에러 타입")
    message: str = Field(..., description="에러 메시지")
    detail: Optional[str] = Field(None, description="상세 에러 정보")
    timestamp: datetime = Field(..., description="에러 발생 시간")

    class Config:
        schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid input parameters",
                "detail": "ticker field is required",
                "timestamp": "2024-01-15T10:30:00"
            }
        }


class HealthResponse(BaseModel):
    """헬스체크 응답 모델"""
    status: str = Field(..., description="서버 상태")
    timestamp: datetime = Field(..., description="체크 시간")
    version: str = Field(..., description="API 버전")

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-15T10:30:00",
                "version": "1.0.0"
            }
        } 