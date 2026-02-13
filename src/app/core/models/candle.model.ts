import { UTCTimestamp } from 'lightweight-charts';

export interface CandlePoint {
  time: UTCTimestamp;
  value: number;
}
