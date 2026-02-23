import { UTCTimestamp } from 'lightweight-charts';

export interface CandlePoint {
  time: UTCTimestamp;
  value: number;
}

export interface CandleOhlc {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}
