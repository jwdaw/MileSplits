// Core data types for the Cross Country Timer application

export interface Runner {
  id: string;
  name: string;
  splits: {
    mile1?: number;
    mile2?: number;
    mile3?: number;
  };
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
}

export type SplitType = "mile1" | "mile2" | "mile3";

// Split recording types
export interface SplitRecord {
  runnerId: string;
  splitType: SplitType;
  time: number; // milliseconds from race start
  timestamp: number; // when the split was recorded
}

export interface SplitRecordingEvent {
  type: "SPLIT_RECORDED";
  payload: SplitRecord;
}

// Timer event types
export interface TimerStartEvent {
  type: "TIMER_START";
  payload: {
    startTime: number;
  };
}

export interface TimerStopEvent {
  type: "TIMER_STOP";
  payload: {
    elapsedTime: number;
  };
}

export interface TimerResetEvent {
  type: "TIMER_RESET";
}

export interface TimerTickEvent {
  type: "TIMER_TICK";
  payload: {
    elapsedTime: number;
  };
}

export type TimerEvent =
  | TimerStartEvent
  | TimerStopEvent
  | TimerResetEvent
  | TimerTickEvent;

export type AppEvent = TimerEvent | SplitRecordingEvent;

// Utility types for component props
export interface SplitButtonProps {
  runnerId: string;
  splitType: SplitType;
  splitTime?: number;
  isDisabled: boolean;
  onSplitRecord: (runnerId: string, splitType: SplitType, time: number) => void;
}

export interface RunnerRowProps {
  runner: Runner;
  elapsedTime: number;
  isTimerRunning: boolean;
  onSplitRecord: (runnerId: string, splitType: SplitType, time: number) => void;
}
