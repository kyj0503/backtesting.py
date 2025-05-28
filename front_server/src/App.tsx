import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  LineChart,
  AreaChart,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Line,
  Area,
  Scatter,
  ReferenceLine,
  Cell
} from 'recharts';
import { ChartDataResponse, ChartDataPoint, EquityPoint, TradeMarker, IndicatorData } from './types/api';

// API 호출 함수
const fetchChartData = async (params: {
  ticker: string;
  start_date: string;
  end_date: string;
  initial_cash: number;
  strategy: string;
  strategy_params?: any;
}): Promise<ChartDataResponse> => {
  const response = await fetch('/api/v1/backtest/chart-data', {
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
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{`날짜: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value?.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// OHLC 캔들스틱 차트 컴포넌트
const OHLCChart: React.FC<{ data: ChartDataPoint[]; indicators: IndicatorData[]; trades: TradeMarker[] }> = ({ 
  data, indicators, trades 
}) => {
  console.log('OHLCChart - 받은 데이터:', { data: data?.length, indicators: indicators?.length, trades: trades?.length }); // 디버깅용
  console.log('OHLCChart - 첫 번째 데이터 샘플:', data?.[0]); // 데이터 구조 확인
  
  // 안전한 데이터 처리
  const safeData = data || [];
  const safeIndicators = indicators || [];
  const safeTrades = trades || [];
  
  // 데이터 병합 (OHLC + 지표)
  const mergedData = safeData.map(ohlc => {
    const point: any = { ...ohlc };
    
    // 지표 데이터 추가
    safeIndicators.forEach(indicator => {
      const indicatorPoint = indicator.data?.find(d => d.date === ohlc.date);
      if (indicatorPoint) {
        point[indicator.name] = indicatorPoint.value;
      }
    });
    
    return point;
  });

  console.log('OHLCChart - 병합된 데이터 샘플:', mergedData?.[0]); // 병합 결과 확인
  console.log('OHLCChart - 병합된 데이터 길이:', mergedData?.length);
  console.log('OHLCChart - 전체 병합 데이터 (처음 3개):', mergedData?.slice(0, 3));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📈 가격 차트 및 기술 지표</h3>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-green-400">
          <p><strong>📊 이 차트는 무엇을 보여주나요?</strong></p>
          <ul className="mt-2 space-y-1">
            <li>• <strong>파란색 선:</strong> 매일의 종가(Close) 움직임</li>
            <li>• <strong>회색 막대:</strong> 거래량 (얼마나 많이 거래되었는지)</li>
            <li>• <strong>주황색 선 (SMA_20):</strong> 최근 20일 평균 주가 (추세 파악용)</li>
            <li>• <strong>점선:</strong> 매수/매도 시점 (Buy & Hold는 첫날 매수만)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">💡 종가가 SMA_20 위에 있으면 상승추세, 아래에 있으면 하락추세로 해석할 수 있습니다.</p>
        </div>
      </div>
      
      {safeData && safeData.length > 0 ? (
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="price" orientation="right" />
              <YAxis yAxisId="volume" orientation="left" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 거래량 */}
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="#8884d8" 
                opacity={0.3}
                name="거래량"
              />
              
              {/* 종가 라인 */}
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="close" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                name="종가"
              />
              
              {/* 기술 지표들 */}
              {safeIndicators.map((indicator, index) => (
                <Line
                  key={indicator.name}
                  yAxisId="price"
                  type="monotone"
                  dataKey={indicator.name}
                  stroke={indicator.color}
                  strokeWidth={1.5}
                  dot={false}
                  name={indicator.name}
                  strokeDasharray={index % 2 === 1 ? "5 5" : undefined}
                />
              ))}
              
              {/* 거래 마커 */}
              {safeTrades.map((trade, index) => (
                <ReferenceLine
                  key={index}
                  yAxisId="price"
                  x={trade.date}
                  stroke={trade.type === 'entry' ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded">
          <p className="text-gray-500">차트 데이터가 없습니다. (데이터 수: {safeData?.length || 0})</p>
        </div>
      )}
    </div>
  );
};

// 자산 곡선 차트 컴포넌트
const EquityChart: React.FC<{ data: EquityPoint[] }> = ({ data }) => {
  console.log('EquityChart - 받은 데이터:', data?.length || 0); // 디버깅용
  console.log('EquityChart - 첫 번째 데이터 샘플:', data?.[0]); // 데이터 구조 확인
  
  // 안전한 데이터 처리
  const safeData = data || [];
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">💰 자산 곡선 (투자 성과)</h3>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
          <p><strong>📈 이 차트는 무엇을 보여주나요?</strong></p>
          <ul className="mt-2 space-y-1">
            <li>• <strong>초록색 선:</strong> 누적 수익률 (시간에 따른 투자 성과)</li>
            <li>• <strong>빨간색 영역:</strong> 드로우다운 (최고점 대비 손실 구간)</li>
            <li>• <strong>0% 기준선:</strong> 손익분기점 (위쪽은 수익, 아래쪽은 손실)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">💡 드로우다운이 클수록 투자 위험이 높다는 의미입니다. 수익률이 꾸준히 상승하는 것이 이상적입니다.</p>
        </div>
      </div>
      
      {safeData && safeData.length > 0 ? (
        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={safeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="return" orientation="left" />
              <YAxis yAxisId="drawdown" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 수익률 라인 */}
              <Line 
                yAxisId="return"
                type="monotone" 
                dataKey="return_pct" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                name="수익률 (%)"
              />
              
              {/* 드로우다운 영역 */}
              <Area
                yAxisId="drawdown"
                type="monotone"
                dataKey="drawdown_pct"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                name="드로우다운 (%)"
              />
              
              {/* 0% 기준선 */}
              <ReferenceLine yAxisId="return" y={0} stroke="#666" strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded">
          <p className="text-gray-500">자산 곡선 데이터가 없습니다. (데이터 수: {safeData?.length || 0})</p>
        </div>
      )}
    </div>
  );
};

// 거래 분석 차트 컴포넌트
const TradesChart: React.FC<{ trades: TradeMarker[] }> = ({ trades }) => {
  // 청산 거래만 필터링 (P&L 정보가 있는)
  const exitTrades = trades.filter(trade => trade.type === 'exit' && trade.pnl_pct !== undefined);
  
  // 거래별 색상
  const getTradeColor = (pnl: number) => pnl >= 0 ? '#10b981' : '#ef4444';
  
  return (
    <div className="w-full h-64">
      <h3 className="text-lg font-bold mb-2">거래 손익 분석</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={exitTrades} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis dataKey="pnl_pct" />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p>{`날짜: ${data.date}`}</p>
                    <p>{`가격: $${data.price.toFixed(2)}`}</p>
                    <p>{`수량: ${data.size}`}</p>
                    <p style={{ color: getTradeColor(data.pnl_pct) }}>
                      {`손익: ${data.pnl_pct.toFixed(2)}%`}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            dataKey="pnl_pct" 
            fill="#8884d8"
          >
            {exitTrades.map((trade, index) => (
              <Cell key={index} fill={getTradeColor(trade.pnl_pct || 0)} />
            ))}
          </Scatter>
          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

// 통계 요약 컴포넌트
const StatsSummary: React.FC<{ stats: ChartDataResponse['summary_stats'] }> = ({ stats }) => {
  const statItems = [
    { 
      label: '총 수익률', 
      value: `${stats.total_return_pct.toFixed(2)}%`, 
      color: stats.total_return_pct >= 0 ? 'text-green-600' : 'text-red-600',
      description: '투자 원금 대비 총 수익의 비율입니다. (현재가 - 매수가) / 매수가 × 100'
    },
    { 
      label: '총 거래 수', 
      value: stats.total_trades.toString(), 
      color: 'text-blue-600',
      description: '백테스트 기간 동안 실행된 총 거래 횟수입니다. Buy & Hold 전략은 1회(매수)입니다.'
    },
    { 
      label: '승률', 
      value: `${stats.win_rate_pct.toFixed(1)}%`, 
      color: 'text-purple-600',
      description: '전체 거래 중 수익을 낸 거래의 비율입니다. 높을수록 좋지만 수익 크기도 중요합니다.'
    },
    { 
      label: '최대 손실', 
      value: `${stats.max_drawdown_pct.toFixed(2)}%`, 
      color: 'text-red-600',
      description: '드로우다운: 투자 포트폴리오가 최고점에서 최대로 떨어진 비율입니다. 투자 위험을 나타내는 지표입니다.'
    },
    { 
      label: '샤프 비율', 
      value: stats.sharpe_ratio.toFixed(3), 
      color: 'text-indigo-600',
      description: '위험 대비 수익률을 나타내는 지표입니다. 높을수록 효율적인 투자입니다. (일반적으로 1.0 이상이 좋음)'
    },
    { 
      label: '수익 팩터', 
      value: stats.profit_factor.toFixed(2), 
      color: 'text-orange-600',
      description: '총 이익을 총 손실로 나눈 값입니다. 1.0보다 크면 수익, 작으면 손실을 의미합니다.'
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📊 백테스트 성과 지표</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow group relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">{item.label}</div>
              <div className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">ℹ️</div>
            </div>
            <div className={`text-2xl font-bold ${item.color} mb-2`}>{item.value}</div>
            
            {/* 설명 툴팁 */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 전체 설명 패널 */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">💡 용어 설명</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Buy & Hold 전략:</strong> 주식을 매수한 후 장기간 보유하는 가장 단순한 투자 전략입니다.</p>
          <p><strong>OHLC 차트:</strong> Open(시가), High(고가), Low(저가), Close(종가)를 보여주는 캔들스틱 차트입니다.</p>
          <p><strong>SMA_20:</strong> 최근 20일간 종가의 평균으로, 주가 추세를 파악하는 기술적 지표입니다.</p>
        </div>
      </div>
    </div>
  );
};

// 테스트 차트 컴포넌트 (Recharts 작동 확인용)
const TestChart = () => {
  const testData = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 150 },
  ];

  return (
    <div className="w-full h-64 bg-yellow-100 p-4 rounded">
      <h3 className="text-lg font-bold mb-2">테스트 차트 (Recharts 작동 확인)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={testData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// 메인 App 컴포넌트
function App() {
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 백테스트 파라미터 상태
  const [backtestParams, setBacktestParams] = useState({
    ticker: 'AAPL',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    initial_cash: 10000,
    strategy: 'buy_and_hold',
    strategy_params: {} as any
  });

  // 전략별 기본 파라미터
  const strategyDefaults = {
    'buy_and_hold': {},
    'sma_crossover': {
      short_window: 10,
      long_window: 20
    },
    'rsi_strategy': {
      rsi_period: 14,
      rsi_upper: 70,
      rsi_lower: 30
    },
    'bollinger_bands': {
      period: 20,
      std_dev: 2.0
    },
    'macd_strategy': {
      fast_period: 12,
      slow_period: 26,
      signal_period: 9
    }
  };

  // 백테스트 실행
  const runBacktest = async (params = backtestParams) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('백테스트 실행 파라미터:', params);
      const data = await fetchChartData(params);
      setChartData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('백테스트 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runBacktest(backtestParams);
  };

  // 파라미터 변경 핸들러
  const handleParamChange = (key: string, value: string | number) => {
    setBacktestParams(prev => ({
      ...prev,
      [key]: value,
      // 전략이 변경될 때 해당 전략의 기본 파라미터로 초기화
      ...(key === 'strategy' && {
        strategy_params: strategyDefaults[value as keyof typeof strategyDefaults] || {}
      })
    }));
  };

  // 전략 파라미터 변경 핸들러
  const handleStrategyParamChange = (paramKey: string, value: number) => {
    setBacktestParams(prev => ({
      ...prev,
      strategy_params: {
        ...prev.strategy_params,
        [paramKey]: value
      }
    }));
  };

  // 초기 로드 시 기본 백테스트 실행
  useEffect(() => {
    runBacktest();
  }, []);

  // 전략별 파라미터 입력 컴포넌트
  const StrategyParamsInput = () => {
    const strategy = backtestParams.strategy;
    
    if (strategy === 'buy_and_hold') {
      return (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
          <p>💡 Buy & Hold 전략은 추가 파라미터가 필요하지 않습니다. 첫날 매수 후 마지막날까지 보유합니다.</p>
        </div>
      );
    }

    if (strategy === 'sma_crossover') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              단기 이동평균 (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.short_window || 10}
              onChange={(e) => handleStrategyParamChange('short_window', parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="50"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">5-50일 (기본값: 10일)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장기 이동평균 (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.long_window || 20}
              onChange={(e) => handleStrategyParamChange('long_window', parseInt(e.target.value) || 20)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="200"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">10-200일 (기본값: 20일)</p>
          </div>
        </div>
      );
    }

    if (strategy === 'rsi_strategy') {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RSI 기간 (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.rsi_period || 14}
              onChange={(e) => handleStrategyParamChange('rsi_period', parseInt(e.target.value) || 14)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="50"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">5-50일 (기본값: 14일)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              과매수 임계값
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.rsi_upper || 70}
              onChange={(e) => handleStrategyParamChange('rsi_upper', parseFloat(e.target.value) || 70)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="50"
              max="90"
              step="5"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">50-90 (기본값: 70)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              과매도 임계값
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.rsi_lower || 30}
              onChange={(e) => handleStrategyParamChange('rsi_lower', parseFloat(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="50"
              step="5"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">10-50 (기본값: 30)</p>
          </div>
        </div>
      );
    }

    if (strategy === 'bollinger_bands') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이동평균 기간 (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.period || 20}
              onChange={(e) => handleStrategyParamChange('period', parseInt(e.target.value) || 20)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="50"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">10-50일 (기본값: 20일)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              표준편차 배수
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.std_dev || 2.0}
              onChange={(e) => handleStrategyParamChange('std_dev', parseFloat(e.target.value) || 2.0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1.0"
              max="3.0"
              step="0.1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">1.0-3.0 (기본값: 2.0)</p>
          </div>
        </div>
      );
    }

    if (strategy === 'macd_strategy') {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              빠른 EMA (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.fast_period || 12}
              onChange={(e) => handleStrategyParamChange('fast_period', parseInt(e.target.value) || 12)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="20"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">5-20일 (기본값: 12일)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              느린 EMA (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.slow_period || 26}
              onChange={(e) => handleStrategyParamChange('slow_period', parseInt(e.target.value) || 26)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="20"
              max="50"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">20-50일 (기본값: 26일)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시그널 라인 (일)
            </label>
            <input
              type="number"
              value={backtestParams.strategy_params.signal_period || 9}
              onChange={(e) => handleStrategyParamChange('signal_period', parseInt(e.target.value) || 9)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="15"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">5-15일 (기본값: 9일)</p>
          </div>
        </div>
      );
    }

    return null;
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>오류:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 백테스트 입력 폼 */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">🔬 백테스팅 분석 도구</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 티커 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주식 티커
              </label>
              <input
                type="text"
                value={backtestParams.ticker}
                onChange={(e) => handleParamChange('ticker', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: AAPL, GOOGL"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">미국 주식 티커를 입력하세요</p>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 날짜
              </label>
              <input
                type="date"
                value={backtestParams.start_date}
                onChange={(e) => handleParamChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 날짜
              </label>
              <input
                type="date"
                value={backtestParams.end_date}
                onChange={(e) => handleParamChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* 초기 투자금 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                초기 투자금 ($)
              </label>
              <input
                type="number"
                value={backtestParams.initial_cash}
                onChange={(e) => handleParamChange('initial_cash', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="1000"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">최소 $1,000</p>
            </div>
          </div>

          {/* 전략 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              투자 전략
            </label>
            <select
              value={backtestParams.strategy}
              onChange={(e) => handleParamChange('strategy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="buy_and_hold">Buy & Hold (매수 후 보유)</option>
              <option value="sma_crossover">SMA Crossover (이동평균 교차)</option>
              <option value="rsi_strategy">RSI Strategy (과매수/과매도)</option>
              <option value="bollinger_bands">Bollinger Bands (볼린저 밴드)</option>
              <option value="macd_strategy">MACD Strategy (MACD 교차)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {backtestParams.strategy === 'buy_and_hold' && '가장 단순한 장기 투자 전략'}
              {backtestParams.strategy === 'sma_crossover' && '단기/장기 이동평균 교차로 매매 신호 생성'}
              {backtestParams.strategy === 'rsi_strategy' && 'RSI 지표로 과매수/과매도 구간에서 매매'}
              {backtestParams.strategy === 'bollinger_bands' && '볼린저 밴드 상/하단 돌파로 매매'}
              {backtestParams.strategy === 'macd_strategy' && 'MACD 라인 교차로 매매 신호 생성'}
            </p>
          </div>

          {/* 전략별 파라미터 입력 컴포넌트 */}
          <StrategyParamsInput />

          {/* 실행 버튼 */}
          <div className="flex items-center space-x-4">
            <button 
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>분석 중...</span>
                </div>
              ) : (
                '백테스트 실행'
              )}
            </button>
            
            {/* 프리셋 버튼들 */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  const newParams = { ...backtestParams, ticker: 'AAPL', start_date: '2023-01-01', end_date: '2023-12-31' };
                  setBacktestParams(newParams);
                }}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                disabled={loading}
              >
                AAPL 2023
              </button>
              <button
                type="button"
                onClick={() => {
                  const newParams = { ...backtestParams, ticker: 'TSLA', start_date: '2022-01-01', end_date: '2022-12-31' };
                  setBacktestParams(newParams);
                }}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
              >
                TSLA 2022
              </button>
              <button
                type="button"
                onClick={() => {
                  const newParams = { ...backtestParams, ticker: 'NVDA', start_date: '2023-01-01', end_date: '2024-01-01' };
                  setBacktestParams(newParams);
                }}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
              >
                NVDA 2023
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">백테스트 실행 중...</div>
          <div className="text-sm text-gray-500 mt-2">
            {backtestParams.ticker} 데이터를 분석하고 있습니다
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {chartData && !loading && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📊 {chartData.ticker} - {chartData.strategy} 백테스트 결과
            </h2>
            <p className="text-gray-600">
              {chartData.start_date} ~ {chartData.end_date} | 초기 투자금: ${backtestParams.initial_cash.toLocaleString()}
            </p>
            
            {/* 백테스팅 설명 배너 */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🔬</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">백테스팅 결과 해석</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    과거 주가 데이터를 이용해 <strong>{backtestParams.strategy.replace('_', ' ')}</strong> 전략의 성과를 시뮬레이션한 결과입니다. 
                    <strong>{chartData.ticker}</strong> 주식에 ${backtestParams.initial_cash.toLocaleString()}를 투자했을 때의 성과를 보여줍니다.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    ⚠️ 과거 성과가 미래 수익을 보장하지는 않습니다. 실제 투자 시에는 신중하게 결정하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 요약 */}
          <StatsSummary stats={chartData.summary_stats} />

          {/* 차트들 */}
          <div className="space-y-8">
            {/* 가격 차트 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <OHLCChart 
                data={chartData.ohlc_data} 
                indicators={chartData.indicators}
                trades={chartData.trade_markers}
              />
            </div>

            {/* 자산 곡선 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <EquityChart data={chartData.equity_data} />
            </div>

            {/* 거래 분석 */}
            {chartData.trade_markers.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <TradesChart trades={chartData.trade_markers} />
              </div>
            )}
          </div>
        </>
      )}

      {/* 초기 상태 (데이터 없음) */}
      {!chartData && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">백테스팅을 시작하세요</h2>
          <p className="text-gray-500 mb-6">위의 폼에서 티커와 기간을 설정한 후 백테스트를 실행해보세요.</p>
        </div>
      )}
    </div>
  );
}

export default App; 