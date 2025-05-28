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
        strategy: 'buy_and_hold',
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
        
        {/* 백테스팅 설명 배너 */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🔬</div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">백테스팅이란?</h2>
              <p className="text-sm text-blue-700 leading-relaxed">
                과거 주가 데이터를 이용해 투자 전략의 성과를 시뮬레이션하는 방법입니다. 
                현재 결과는 <strong>Buy & Hold 전략</strong> (매수 후 보유)으로 
                <strong>${chartData.ticker}</strong> 주식에 1만 달러를 투자했을 때의 성과를 보여줍니다.
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