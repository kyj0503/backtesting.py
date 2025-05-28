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
    <div className="w-full h-96">
      <h3 className="text-lg font-bold mb-2">가격 차트 및 기술 지표</h3>
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
    <div className="w-full h-80">
      <h3 className="text-lg font-bold mb-2">자산 곡선</h3>
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
    { label: '총 수익률', value: `${stats.total_return_pct.toFixed(2)}%`, color: stats.total_return_pct >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: '총 거래 수', value: stats.total_trades.toString(), color: 'text-blue-600' },
    { label: '승률', value: `${stats.win_rate_pct.toFixed(1)}%`, color: 'text-purple-600' },
    { label: '최대 손실', value: `${stats.max_drawdown_pct.toFixed(2)}%`, color: 'text-red-600' },
    { label: '샤프 비율', value: stats.sharpe_ratio.toFixed(3), color: 'text-indigo-600' },
    { label: '수익 팩터', value: stats.profit_factor.toFixed(2), color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
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

  // 백테스트 실행
  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ticker: 'AAPL',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        initial_cash: 10000,
        strategy: 'sma_crossover',
        strategy_params: {
          short_window: 10,
          long_window: 20
        }
      };
      
      const data = await fetchChartData(params);
      console.log('받은 차트 데이터:', data); // 디버깅용
      console.log('OHLC 데이터 수:', data.ohlc_data?.length || 0);
      console.log('자산 곡선 데이터 수:', data.equity_data?.length || 0);
      console.log('거래 마커 수:', data.trade_markers?.length || 0);
      console.log('지표 수:', data.indicators?.length || 0);
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">백테스트 실행 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>오류:</strong> {error}
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <button 
          onClick={runBacktest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          백테스트 실행
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {chartData.ticker} - {chartData.strategy} 백테스트 결과
        </h1>
        <p className="text-gray-600">
          {chartData.start_date} ~ {chartData.end_date}
        </p>
      </div>

      {/* 통계 요약 */}
      <StatsSummary stats={chartData.summary_stats} />

      {/* 차트들 */}
      <div className="space-y-6">
        {/* 가격 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <OHLCChart 
            data={chartData.ohlc_data} 
            indicators={chartData.indicators}
            trades={chartData.trade_markers}
          />
        </div>

        {/* 자산 곡선 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <EquityChart data={chartData.equity_data} />
        </div>

        {/* 거래 분석 */}
        {chartData.trade_markers.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <TradesChart trades={chartData.trade_markers} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 