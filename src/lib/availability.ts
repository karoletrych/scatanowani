import type {
  Answer,
  ParticipantAnswers,
  RoomConfig,
  RoomData,
  SlotStat,
  Slot,
  Verdict,
} from "../types";
import { fromMinutes, toMinutes, weekdayOf } from "./dates";

export function slotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function parseSlotKey(key: string): Slot | null {
  const [date, time] = key.split("|");
  if (!date || !time) return null;
  return { date, time };
}

export function daySlotTimes(config: RoomConfig): string[] {
  const start = toMinutes(config.dayStart);
  const end = toMinutes(config.dayEnd);
  const step = Math.max(15, config.slotMinutes);
  const times: string[] = [];
  for (let minutes = start; minutes < end; minutes += step) {
    times.push(fromMinutes(minutes));
  }
  return times;
}

export function isSlotOpen(config: RoomConfig, date: string, time: string): boolean {
  const minutes = toMinutes(time);
  const override = config.dayOverrides[date];
  if (override?.closed) return false;
  if (override?.from && override?.to) {
    return minutes >= toMinutes(override.from) && minutes < toMinutes(override.to);
  }
  const weekday = weekdayOf(date);
  return config.openWindows.some(
    (window) =>
      window.weekday === weekday &&
      minutes >= toMinutes(window.from) &&
      minutes < toMinutes(window.to),
  );
}

export function placeForDate(config: RoomConfig, date: string): string {
  return config.dayOverrides[date]?.place ?? config.place;
}

export function dayOpenLabel(config: RoomConfig, date: string): string {
  const override = config.dayOverrides[date];
  if (override?.closed) return "zamknięte";
  if (override?.from && override?.to) {
    return `${override.from}–${override.to}`;
  }
  const weekday = weekdayOf(date);
  const windows = config.openWindows
    .filter((window) => window.weekday === weekday)
    .sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
  if (windows.length === 0) return "zamknięte";
  return windows.map((window) => `${window.from}–${window.to}`).join(", ");
}

function inRange(time: string, from: string, to: string): boolean {
  const minutes = toMinutes(time);
  return minutes >= toMinutes(from) && minutes < toMinutes(to);
}

export function resolveAnswer(
  answers: ParticipantAnswers | undefined,
  slot: Slot,
): Answer {
  if (!answers) return "unknown";

  const explicit = answers.slots[slotKey(slot.date, slot.time)];
  if (explicit) return explicit;

  const exceptions = answers.exceptions.filter(
    (exception) => exception.date === slot.date && inRange(slot.time, exception.from, exception.to),
  );
  if (exceptions.length > 0) {
    return exceptions.some((exception) => exception.verdict === "no") ? "no" : "yes";
  }

  const weekday = weekdayOf(slot.date);
  const rules = answers.rules.filter(
    (rule) => rule.weekday === weekday && inRange(slot.time, rule.from, rule.to),
  );
  if (rules.length > 0) {
    return rules.some((rule) => rule.verdict === "no") ? "no" : "yes";
  }

  return "unknown";
}

export function openSlots(config: RoomConfig, dates: string[]): Slot[] {
  const times = daySlotTimes(config);
  const slots: Slot[] = [];
  for (const date of dates) {
    for (const time of times) {
      if (isSlotOpen(config, date, time)) slots.push({ date, time });
    }
  }
  return slots;
}

export function isDateOpen(config: RoomConfig, date: string): boolean {
  return daySlotTimes(config).some((time) => isSlotOpen(config, date, time));
}

export function statForSlot(room: RoomData, slot: Slot): SlotStat {
  const stat: SlotStat = {
    yes: 0,
    no: 0,
    unknown: 0,
    total: 0,
    yesNames: [],
    noNames: [],
    unknownNames: [],
  };

  const ids = Object.keys(room.participants);
  for (const id of ids) {
    const name = room.participants[id]?.name ?? id;
    const answer = resolveAnswer(room.answers[id], slot);
    stat.total += 1;
    if (answer === "yes") {
      stat.yes += 1;
      stat.yesNames.push(name);
    } else if (answer === "no") {
      stat.no += 1;
      stat.noNames.push(name);
    } else {
      stat.unknown += 1;
      stat.unknownNames.push(name);
    }
  }

  const collator = new Intl.Collator("pl");
  stat.yesNames.sort(collator.compare);
  stat.noNames.sort(collator.compare);
  stat.unknownNames.sort(collator.compare);
  return stat;
}

export interface AvailabilityWindow extends Slot {
  to: string;
  slotCount: number;
  stat: SlotStat;
}

function windowsForDate(room: RoomData, date: string): AvailabilityWindow[] {
  const ids = Object.keys(room.participants).sort();
  const step = Math.max(15, room.config.slotMinutes);
  const windows: AvailabilityWindow[] = [];
  let current: AvailabilityWindow | null = null;
  let currentSignature = "";

  for (const time of daySlotTimes(room.config)) {
    if (!isSlotOpen(room.config, date, time)) {
      if (current) {
        windows.push(current);
        current = null;
        currentSignature = "";
      }
      continue;
    }

    const signature = ids
      .filter((id) => resolveAnswer(room.answers[id], { date, time }) === "yes")
      .join("|");

    if (current && signature === currentSignature) {
      current.slotCount += 1;
      current.to = fromMinutes(toMinutes(time) + step);
      continue;
    }

    if (current) windows.push(current);
    current = {
      date,
      time,
      to: fromMinutes(toMinutes(time) + step),
      slotCount: 1,
      stat: statForSlot(room, { date, time }),
    };
    currentSignature = signature;
  }

  if (current) windows.push(current);
  return windows;
}

function sortWindows(a: AvailabilityWindow, b: AvailabilityWindow): number {
  return (
    b.stat.yes - a.stat.yes ||
    b.slotCount - a.slotCount ||
    a.stat.no - b.stat.no ||
    a.date.localeCompare(b.date) ||
    a.time.localeCompare(b.time)
  );
}

export function bestWindowForDay(room: RoomData, date: string): AvailabilityWindow | null {
  return (
    windowsForDate(room, date)
      .filter((window) => window.stat.yes > 0)
      .sort(sortWindows)[0] ?? null
  );
}

export function bestWindows(
  room: RoomData,
  dates: string[],
  limit = 6,
): AvailabilityWindow[] {
  const windows = dates
    .flatMap((date) => windowsForDate(room, date))
    .filter((window) => window.stat.yes >= (window.stat.total >= 4 ? 2 : 1))
    .sort(sortWindows);

  const perDay = new Map<string, number>();
  const picked: AvailabilityWindow[] = [];
  for (const window of windows) {
    const used = perDay.get(window.date) ?? 0;
    if (used >= 2) continue;
    picked.push(window);
    perDay.set(window.date, used + 1);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function dayHasAnyAnswer(room: RoomData, date: string): boolean {
  for (const time of daySlotTimes(room.config)) {
    if (!isSlotOpen(room.config, date, time)) continue;
    for (const id of Object.keys(room.participants)) {
      if (resolveAnswer(room.answers[id], { date, time }) !== "unknown") return true;
    }
  }
  return false;
}

export interface AnswerCounts {
  yes: number;
  no: number;
  unknown: number;
  total: number;
}

export function countsFor(
  answers: ParticipantAnswers | undefined,
  config: RoomConfig,
  dates: string[],
): AnswerCounts {
  const counts: AnswerCounts = { yes: 0, no: 0, unknown: 0, total: 0 };
  for (const slot of openSlots(config, dates)) {
    const answer = resolveAnswer(answers, slot);
    counts.total += 1;
    counts[answer] += 1;
  }
  return counts;
}

export function progressFor(
  answers: ParticipantAnswers | undefined,
  config: RoomConfig,
  dates: string[],
): { answered: number; total: number; percent: number } {
  const slots = openSlots(config, dates);
  let answered = 0;
  for (const slot of slots) {
    if (resolveAnswer(answers, slot) !== "unknown") answered += 1;
  }
  const total = slots.length;
  return {
    answered,
    total,
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
  };
}

export function dayHasData(answers: ParticipantAnswers | undefined, date: string): boolean {
  if (!answers) return false;
  const hasSlot = Object.keys(answers.slots).some((key) => key.startsWith(`${date}|`));
  const hasException = answers.exceptions.some((exception) => exception.date === date);
  return hasSlot || hasException;
}

export function withWholeDay(
  answers: ParticipantAnswers,
  config: RoomConfig,
  date: string,
  verdict: "yes" | "no",
): ParticipantAnswers {
  const slots = { ...answers.slots };
  for (const key of Object.keys(slots)) {
    if (key.startsWith(`${date}|`)) delete slots[key];
  }
  const exceptions = answers.exceptions.filter((exception) => exception.date !== date);
  exceptions.push({
    id: `${date}-${verdict}-${Math.random().toString(36).slice(2, 7)}`,
    date,
    from: config.dayStart,
    to: config.dayEnd,
    verdict,
  });
  return { ...answers, slots, exceptions };
}

export function withDayCleared(
  answers: ParticipantAnswers,
  date: string,
): ParticipantAnswers {
  const slots = { ...answers.slots };
  for (const key of Object.keys(slots)) {
    if (key.startsWith(`${date}|`)) delete slots[key];
  }
  return {
    ...answers,
    slots,
    exceptions: answers.exceptions.filter((exception) => exception.date !== date),
  };
}

export function withSlot(
  answers: ParticipantAnswers,
  slot: Slot,
  verdict: "yes" | "no" | "unknown",
): ParticipantAnswers {
  const slots = { ...answers.slots };
  const key = slotKey(slot.date, slot.time);
  if (verdict === "unknown") {
    delete slots[key];
  } else {
    slots[key] = verdict;
  }
  return { ...answers, slots };
}

export function fillUnknown(
  answers: ParticipantAnswers,
  config: RoomConfig,
  dates: string[],
  verdict: Verdict,
): { answers: ParticipantAnswers; changedKeys: string[] } {
  const slots = { ...answers.slots };
  const changedKeys: string[] = [];

  for (const date of dates) {
    for (const time of daySlotTimes(config)) {
      if (!isSlotOpen(config, date, time)) continue;
      const key = slotKey(date, time);
      if (slots[key]) continue;
      if (resolveAnswer(answers, { date, time }) !== "unknown") continue;
      slots[key] = verdict;
      changedKeys.push(key);
    }
  }

  return { answers: { ...answers, slots }, changedKeys };
}
