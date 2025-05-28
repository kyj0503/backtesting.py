"""
API 요청 모델 정의
"""
from datetime import date, datetime
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field, validator
from enum import Enum


class StrategyType(str, Enum):
    """지원되는 전략 타입"""
    SMA_CROSSOVER = "sma_crossover"
    RSI_STRATEGY = "rsi_strategy"
    BOLLINGER_BANDS = "bollinger_bands"
    MACD_STRATEGY = "macd_strategy"
    BUY_AND_HOLD = "buy_and_hold"


class OptimizationMethod(str, Enum):
    """최적화 방법"""
    GRID = "grid"
    SAMBO = "sambo"


class BacktestRequest(BaseModel):
    """백테스트 요청 모델"""
    ticker: str = Field(..., description="주식 티커 심볼 (예: AAPL, GOOGL)")
    start_date: Union[date, str] = Field(..., description="백테스트 시작 날짜")
    end_date: Union[date, str] = Field(..., description="백테스트 종료 날짜")
    initial_cash: float = Field(default=10000.0, gt=0, description="초기 투자금액")
    strategy: StrategyType = Field(..., description="사용할 전략")
    strategy_params: Optional[Dict[str, Any]] = Field(default=None, description="전략 파라미터")
    commission: float = Field(default=0.002, ge=0, le=0.1, description="거래 수수료 (소수점)")
    spread: float = Field(default=0.0, ge=0, description="스프레드")
    
    @validator('start_date', 'end_date', pre=True)
    def parse_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError('날짜 형식은 YYYY-MM-DD여야 합니다')
        return v
    
    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('종료 날짜는 시작 날짜보다 이후여야 합니다')
        return v

    class Config:
        schema_extra = {
            "example": {
                "ticker": "AAPL",
                "start_date": "2020-01-01",
                "end_date": "2023-12-31",
                "initial_cash": 10000.0,
                "strategy": "sma_crossover",
                "strategy_params": {
                    "short_window": 10,
                    "long_window": 20
                },
                "commission": 0.002
            }
        }


class OptimizationRequest(BaseModel):
    """파라미터 최적화 요청 모델"""
    ticker: str = Field(..., description="주식 티커 심볼")
    start_date: Union[date, str] = Field(..., description="백테스트 시작 날짜")
    end_date: Union[date, str] = Field(..., description="백테스트 종료 날짜")
    initial_cash: float = Field(default=10000.0, gt=0, description="초기 투자금액")
    strategy: StrategyType = Field(..., description="최적화할 전략")
    param_ranges: Dict[str, List[Union[int, float]]] = Field(..., description="파라미터 범위")
    method: OptimizationMethod = Field(default=OptimizationMethod.GRID, description="최적화 방법")
    maximize: str = Field(default="SQN", description="최적화할 지표")
    max_tries: Optional[int] = Field(default=100, description="최대 시도 횟수")
    commission: float = Field(default=0.002, ge=0, le=0.1, description="거래 수수료")
    
    @validator('start_date', 'end_date', pre=True)
    def parse_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError('날짜 형식은 YYYY-MM-DD여야 합니다')
        return v

    class Config:
        schema_extra = {
            "example": {
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
                "max_tries": 100
            }
        }


class PlotRequest(BaseModel):
    """차트 생성 요청 모델"""
    ticker: str = Field(..., description="주식 티커 심볼")
    start_date: Union[date, str] = Field(..., description="시작 날짜")
    end_date: Union[date, str] = Field(..., description="종료 날짜")
    strategy: StrategyType = Field(..., description="전략")
    strategy_params: Optional[Dict[str, Any]] = Field(default=None, description="전략 파라미터")
    plot_width: int = Field(default=1200, description="차트 너비")
    filename: Optional[str] = Field(default=None, description="저장할 파일명")
    
    @validator('start_date', 'end_date', pre=True)
    def parse_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError('날짜 형식은 YYYY-MM-DD여야 합니다')
        return v 