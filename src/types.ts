export type Answer = "yes" | "no" | "unknown";
export type Verdict = "yes" | "no";

export interface OpenWindow {
  weekday: number; // 0 = niedziela ... 6 = sobota
  from: string; // "HH:MM"
  to: string; // "HH:MM", wyłączna
}

export interface DayOverride {
  closed?: boolean;
  from?: string;
  to?: string;
  place?: string;
}

export interface RoomConfig {
  groupName: string;
  place: string;
  dayStart: string;
  dayEnd: string;
  slotMinutes: number;
  horizonDays: number;
  openWindows: OpenWindow[];
  dayOverrides: Record<string, DayOverride>;
  updatedAt?: number;
}

export interface Participant {
  name: string;
  joinedAt: number;
}

export interface RecurringRule {
  id: string;
  weekday: number;
  from: string;
  to: string;
  verdict: Verdict;
}

export interface OneOff {
  id: string;
  date: string;
  from: string;
  to: string;
  verdict: Verdict;
}

export interface ParticipantAnswers {
  slots: Record<string, Verdict>;
  rules: RecurringRule[];
  exceptions: OneOff[];
  updatedAt?: number;
}

export interface RoomData {
  config: RoomConfig;
  participants: Record<string, Participant>;
  answers: Record<string, ParticipantAnswers>;
}

export interface Slot {
  date: string;
  time: string;
}

export interface SlotStat {
  yes: number;
  no: number;
  unknown: number;
  total: number;
  yesNames: string[];
  noNames: string[];
  unknownNames: string[];
}
