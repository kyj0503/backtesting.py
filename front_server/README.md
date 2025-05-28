# 백테스팅 대시보드 (React + Recharts)

백테스팅 API 서버의 결과를 시각화하는 React 프론트엔드 애플리케이션입니다.

## 기능

- **실시간 백테스팅 결과 시각화**
- **인터랙티브 차트**:
  - OHLC 가격 차트 + 기술 지표
  - 자산 곡선 및 드로우다운
  - 거래 손익 스캐터 차트
- **종합 통계 대시보드**
- **반응형 디자인** (Tailwind CSS)

## 기술 스택

- **React 18** + TypeScript
- **Recharts** - 차트 라이브러리
- **Tailwind CSS** - 스타일링
- **Vite** - 빌드 도구

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드

```bash
npm run build
```

## API 서버 연동

이 프론트엔드는 백테스팅 API 서버와 연동됩니다:
- API 서버가 `http://localhost:8000`에서 실행되어야 합니다
- Vite 프록시 설정으로 `/api` 요청을 자동으로 API 서버로 전달합니다

## 프로젝트 구조

```
src/
├── App.tsx              # 메인 애플리케이션 컴포넌트
├── main.tsx            # React 애플리케이션 진입점
├── index.css           # 글로벌 스타일 (Tailwind)
└── types/
    └── api.ts          # API 타입 정의
```

## 차트 컴포넌트

### OHLCChart
- 가격 데이터 (OHLC) 캔들스틱 차트
- 기술 지표 오버레이 (SMA, RSI, MACD 등)
- 거래 마커 (진입/청산 포인트)
- 거래량 바 차트

### EquityChart
- 자산 곡선 (누적 수익률)
- 드로우다운 영역 차트
- 기준선 (0% 수익률)

### TradesChart
- 거래별 손익 스캐터 플롯
- 수익/손실 색상 구분
- 상세 툴팁 (날짜, 가격, 수량, 손익)

### StatsSummary
- 주요 성능 지표 카드들
- 총 수익률, 거래 수, 승률, 최대 손실 등
- 색상 코딩 (수익/손실)

## 커스터마이징

### 차트 색상 변경
`App.tsx`의 각 차트 컴포넌트에서 `stroke`, `fill` 속성을 수정하세요.

### 새로운 지표 추가
1. `types/api.ts`에서 타입 정의 업데이트
2. `OHLCChart` 컴포넌트에서 새로운 Line 추가

### 스타일 변경
Tailwind CSS 클래스를 수정하거나 `index.css`에 커스텀 스타일을 추가하세요.

## 문제 해결

### API 연결 오류
- 백테스팅 API 서버가 실행 중인지 확인
- `vite.config.ts`의 프록시 설정 확인

### 차트 렌더링 오류
- 브라우저 개발자 도구에서 콘솔 에러 확인
- 데이터 형식이 올바른지 확인

### 빌드 오류
- TypeScript 타입 에러 확인
- 의존성 버전 호환성 확인

## 라이선스

MIT License 