"""
백테스팅 실행 서비스
"""
import time
from datetime import datetime, date
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
import logging
import traceback

from backtesting import Backtest
from ..models.requests import BacktestRequest, OptimizationRequest
from ..models.responses import BacktestResult, OptimizationResult, ChartDataResponse, ChartDataPoint, EquityPoint, TradeMarker, IndicatorData
from ..utils.data_fetcher import data_fetcher
from .strategy_service import strategy_service
from ..core.config import settings

logger = logging.getLogger(__name__)


class BacktestService:
    """백테스팅 서비스 클래스"""
    
    def __init__(self):
        self.data_fetcher = data_fetcher
        self.strategy_service = strategy_service
    
    async def run_backtest(self, request: BacktestRequest) -> BacktestResult:
        """
        백테스트 실행
        
        Args:
            request: 백테스트 요청
            
        Returns:
            백테스트 결과
        """
        start_time = time.time()
        
        try:
            # 1. 데이터 수집
            logger.info(f"백테스트 시작: {request.ticker}, {request.strategy}")
            
            data = self.data_fetcher.get_stock_data(
                ticker=request.ticker,
                start_date=request.start_date,
                end_date=request.end_date
            )
            
            # 2. 전략 클래스 및 파라미터 준비
            strategy_class = self.strategy_service.get_strategy_class(request.strategy)
            
            # 전략 파라미터 검증 및 적용
            if request.strategy_params:
                validated_params = self.strategy_service.validate_strategy_params(
                    request.strategy, request.strategy_params
                )
            else:
                validated_params = self.strategy_service.validate_strategy_params(
                    request.strategy, {}
                )
            
            # 3. 백테스트 설정 및 실행
            bt = Backtest(
                data=data,
                strategy=strategy_class,
                cash=request.initial_cash,
                commission=request.commission,
                spread=request.spread,
                exclusive_orders=True
            )
            
            # 전략 파라미터 적용하여 실행
            stats = bt.run(**validated_params)
            
            # 4. 결과 처리
            execution_time = time.time() - start_time
            
            result = self._convert_stats_to_result(
                stats=stats,
                ticker=request.ticker,
                strategy=request.strategy,
                start_date=request.start_date,
                end_date=request.end_date,
                initial_cash=request.initial_cash,
                execution_time=execution_time
            )
            
            logger.info(f"백테스트 완료: {request.ticker}, 실행시간: {execution_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"백테스트 실행 실패: {str(e)}")
            raise
    
    async def optimize_strategy(self, request: OptimizationRequest) -> OptimizationResult:
        """
        전략 파라미터 최적화
        
        Args:
            request: 최적화 요청
            
        Returns:
            최적화 결과
        """
        start_time = time.time()
        
        try:
            logger.info(f"최적화 시작: {request.ticker}, {request.strategy}")
            
            # 1. 데이터 수집
            data = self.data_fetcher.get_stock_data(
                ticker=request.ticker,
                start_date=request.start_date,
                end_date=request.end_date
            )
            
            # 2. 전략 클래스 준비
            strategy_class = self.strategy_service.get_strategy_class(request.strategy)
            
            # 3. 백테스트 설정
            bt = Backtest(
                data=data,
                strategy=strategy_class,
                cash=request.initial_cash,
                commission=request.commission,
                exclusive_orders=True
            )
            
            # 4. 최적화 파라미터 범위 변환
            param_ranges = self._convert_param_ranges(request.param_ranges)
            
            # 5. 최적화 실행
            stats = bt.optimize(
                **param_ranges,
                maximize=request.maximize,
                method=request.method.value,
                max_tries=request.max_tries,
                random_state=42
            )
            
            # 6. 최적 파라미터 추출
            best_params = {}
            for param_name in request.param_ranges.keys():
                if hasattr(stats, '_strategy'):
                    # 최적화 결과에서 파라미터 값 추출
                    best_params[param_name] = getattr(stats._strategy, param_name, None)
                else:
                    # stats가 Series인 경우 인덱스에서 파라미터 정보 추출
                    strategy_str = str(stats.get('_strategy', ''))
                    # 파라미터를 파싱하여 추출 (예: "Strategy(param1=10,param2=20)")
                    # 이 부분은 backtesting.py 라이브러리의 구현에 따라 다를 수 있음
                    pass
            
            # 최적화 결과가 없는 경우 기본값 사용
            if not best_params:
                best_params = self.strategy_service.validate_strategy_params(
                    request.strategy, {}
                )
            
            # 7. 최적 파라미터로 다시 백테스트 실행 (결과 확인용)
            final_stats = bt.run(**best_params)
            
            # 8. 결과 변환
            execution_time = time.time() - start_time
            
            backtest_result = self._convert_stats_to_result(
                stats=final_stats,
                ticker=request.ticker,
                strategy=request.strategy,
                start_date=request.start_date,
                end_date=request.end_date,
                initial_cash=request.initial_cash,
                execution_time=execution_time
            )
            
            # 최적화된 성능 지표 값 추출
            best_score = float(stats.get(request.maximize, 0))
            if best_score == 0:
                best_score = float(final_stats.get(request.maximize, 0))
            
            result = OptimizationResult(
                ticker=request.ticker,
                strategy=request.strategy,
                method=request.method.value,
                total_iterations=request.max_tries or 100,
                best_params=best_params,
                best_score=best_score,
                optimization_target=request.maximize,
                backtest_result=backtest_result,
                execution_time_seconds=execution_time,
                timestamp=datetime.now()
            )
            
            logger.info(f"최적화 완료: {request.ticker}, 실행시간: {execution_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"최적화 실행 실패: {str(e)}")
            raise
    
    def _convert_stats_to_result(
        self,
        stats: pd.Series,
        ticker: str,
        strategy: str,
        start_date: date,
        end_date: date,
        initial_cash: float,
        execution_time: float
    ) -> BacktestResult:
        """백테스트 통계를 결과 모델로 변환"""
        
        duration = (end_date - start_date).days
        
        # 안전한 값 추출 함수
        def safe_float(key: str, default: float = 0.0) -> float:
            try:
                value = stats.get(key, default)
                return float(value) if value is not None else default
            except (ValueError, TypeError):
                return default
        
        def safe_int(key: str, default: int = 0) -> int:
            try:
                value = stats.get(key, default)
                return int(value) if value is not None else default
            except (ValueError, TypeError):
                return default
        
        return BacktestResult(
            ticker=ticker,
            strategy=strategy,
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d'),
            duration_days=duration,
            initial_cash=initial_cash,
            final_equity=safe_float('Equity Final [$]'),
            total_return_pct=safe_float('Return [%]'),
            annualized_return_pct=safe_float('Return (Ann.) [%]'),
            buy_and_hold_return_pct=safe_float('Buy & Hold Return [%]'),
            cagr_pct=safe_float('CAGR [%]'),
            volatility_pct=safe_float('Volatility (Ann.) [%]'),
            sharpe_ratio=safe_float('Sharpe Ratio'),
            sortino_ratio=safe_float('Sortino Ratio'),
            calmar_ratio=safe_float('Calmar Ratio'),
            max_drawdown_pct=safe_float('Max. Drawdown [%]'),
            avg_drawdown_pct=safe_float('Avg. Drawdown [%]'),
            total_trades=safe_int('# Trades'),
            win_rate_pct=safe_float('Win Rate [%]'),
            profit_factor=safe_float('Profit Factor'),
            avg_trade_pct=safe_float('Avg. Trade [%]'),
            best_trade_pct=safe_float('Best Trade [%]'),
            worst_trade_pct=safe_float('Worst Trade [%]'),
            alpha_pct=safe_float('Alpha [%]') if 'Alpha [%]' in stats else None,
            beta=safe_float('Beta') if 'Beta' in stats else None,
            kelly_criterion=safe_float('Kelly Criterion') if 'Kelly Criterion' in stats else None,
            sqn=safe_float('SQN') if 'SQN' in stats else None,
            execution_time_seconds=execution_time,
            timestamp=datetime.now()
        )
    
    def _convert_param_ranges(self, param_ranges: Dict[str, list]) -> Dict[str, range]:
        """파라미터 범위를 최적화용 range 객체로 변환"""
        converted = {}
        for param_name, param_range in param_ranges.items():
            if len(param_range) != 2:
                raise ValueError(f"파라미터 {param_name}의 범위는 [min, max] 형태여야 합니다")
            
            min_val, max_val = param_range
            if isinstance(min_val, int) and isinstance(max_val, int):
                converted[param_name] = range(min_val, max_val + 1)
            else:
                # float 범위의 경우 적절한 스텝으로 변환
                step = (max_val - min_val) / 10  # 10개 구간으로 나눔
                converted[param_name] = [min_val + i * step for i in range(11)]
        
        return converted
    
    def validate_backtest_request(self, request: BacktestRequest) -> None:
        """백테스트 요청 유효성 검증"""
        # 날짜 범위 검증
        duration = (request.end_date - request.start_date).days
        if duration > settings.max_backtest_duration_days:
            raise ValueError(f"백테스트 기간이 너무 깁니다. 최대 {settings.max_backtest_duration_days}일")
        
        if duration < 30:
            raise ValueError("백테스트 기간은 최소 30일 이상이어야 합니다")
        
        # 티커 유효성 검증은 선택사항으로 변경 (API 호출 속도 향상)
        # if not self.data_fetcher.validate_ticker(request.ticker):
        #     raise ValueError(f"유효하지 않은 티커: {request.ticker}")

    async def generate_chart_data(self, request: BacktestRequest, backtest_result: BacktestResult = None) -> ChartDataResponse:
        """
        백테스트 결과로부터 Recharts용 차트 데이터를 생성합니다.
        """
        logger = logging.getLogger(__name__)
        
        try:
            # 백테스트가 아직 실행되지 않았다면 실행
            if backtest_result is None:
                backtest_result = await self.run_backtest(request)
            
            # 데이터 가져오기
            data = await data_fetcher.get_data(
                ticker=request.ticker,
                start_date=request.start_date,
                end_date=request.end_date
            )
            
            # 백테스트 다시 실행하여 상세 데이터 얻기
            strategy_class = strategy_service.get_strategy_class(request.strategy)
            params = request.strategy_params or {}
            
            from backtesting import Backtest
            bt = Backtest(
                data, 
                strategy_class, 
                cash=request.initial_cash,
                commission=request.commission
            )
            
            # 백테스트 실행 (결과 객체 필요)
            results = bt.run(**params)
            
            # 1. OHLC 데이터 생성
            ohlc_data = []
            for idx, row in data.iterrows():
                ohlc_data.append(ChartDataPoint(
                    timestamp=idx.isoformat(),
                    date=idx.strftime('%Y-%m-%d'),
                    open=self.safe_float(row['Open']),
                    high=self.safe_float(row['High']),
                    low=self.safe_float(row['Low']),
                    close=self.safe_float(row['Close']),
                    volume=self.safe_int(row.get('Volume', 0))
                ))
            
            # 2. 자산 곡선 데이터 생성
            equity_curve = results['_equity_curve']
            equity_data = []
            initial_equity = equity_curve['Equity'].iloc[0]
            
            for idx, row in equity_curve.iterrows():
                equity = self.safe_float(row['Equity'])
                return_pct = ((equity / initial_equity) - 1) * 100
                drawdown_pct = self.safe_float(row.get('DrawdownPct', 0)) * 100
                
                equity_data.append(EquityPoint(
                    timestamp=idx.isoformat(),
                    date=idx.strftime('%Y-%m-%d'),
                    equity=equity,
                    return_pct=return_pct,
                    drawdown_pct=drawdown_pct
                ))
            
            # 3. 거래 마커 생성
            trades = results['_trades']
            trade_markers = []
            
            if not trades.empty:
                for _, trade in trades.iterrows():
                    # 진입 마커
                    entry_time = trade.get('EntryTime')
                    if pd.notna(entry_time):
                        trade_markers.append(TradeMarker(
                            timestamp=entry_time.isoformat(),
                            date=entry_time.strftime('%Y-%m-%d'),
                            price=self.safe_float(trade['EntryPrice']),
                            type="entry",
                            side="buy" if trade['Size'] > 0 else "sell",
                            size=abs(self.safe_float(trade['Size'])),
                            pnl_pct=None
                        ))
                    
                    # 청산 마커
                    exit_time = trade.get('ExitTime')
                    if pd.notna(exit_time):
                        trade_markers.append(TradeMarker(
                            timestamp=exit_time.isoformat(),
                            date=exit_time.strftime('%Y-%m-%d'),
                            price=self.safe_float(trade['ExitPrice']),
                            type="exit",
                            side="sell" if trade['Size'] > 0 else "buy",
                            size=abs(self.safe_float(trade['Size'])),
                            pnl_pct=self.safe_float(trade.get('ReturnPct', 0)) * 100
                        ))
            
            # 4. 기술 지표 데이터 생성
            indicators = []
            strategy_indicators = results.get('_strategy', {})
            
            if hasattr(strategy_indicators, '_indicators'):
                color_palette = ['#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042']
                
                for i, indicator in enumerate(strategy_indicators._indicators):
                    if hasattr(indicator, 'name') and hasattr(indicator, '_opts'):
                        indicator_data = []
                        indicator_values = np.atleast_2d(indicator)
                        
                        for j, values in enumerate(indicator_values):
                            if len(values) == len(data):
                                for idx, value in zip(data.index, values):
                                    if not np.isnan(value):
                                        indicator_data.append({
                                            "timestamp": idx.isoformat(),
                                            "date": idx.strftime('%Y-%m-%d'),
                                            "value": self.safe_float(value)
                                        })
                        
                        if indicator_data:
                            indicators.append(IndicatorData(
                                name=str(indicator.name),
                                type="line",
                                color=color_palette[i % len(color_palette)],
                                data=indicator_data
                            ))
            
            # 5. 요약 통계
            summary_stats = {
                "total_return_pct": backtest_result.total_return_pct,
                "total_trades": backtest_result.total_trades,
                "win_rate_pct": backtest_result.win_rate_pct,
                "max_drawdown_pct": backtest_result.max_drawdown_pct,
                "sharpe_ratio": backtest_result.sharpe_ratio,
                "profit_factor": backtest_result.profit_factor
            }
            
            return ChartDataResponse(
                ticker=request.ticker,
                strategy=request.strategy,
                start_date=request.start_date,
                end_date=request.end_date,
                ohlc_data=ohlc_data,
                equity_data=equity_data,
                trade_markers=trade_markers,
                indicators=indicators,
                summary_stats=summary_stats
            )
            
        except Exception as e:
            logger.error(f"차트 데이터 생성 실패: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception(f"차트 데이터 생성 중 오류 발생: {str(e)}")


# 글로벌 인스턴스
backtest_service = BacktestService() 