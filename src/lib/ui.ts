import type { Answer, Verdict } from "../types";

const AVATAR_COLORS = [
  "#2f5d3a",
  "#c4562f",
  "#2f6d7a",
  "#a8761f",
  "#6b4a7a",
  "#8a4b3a",
  "#4f6b2f",
  "#a94848",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

export function answerLabel(answer: Answer): string {
  if (answer === "yes") return "mogę";
  if (answer === "no") return "nie mogę";
  return "nie wiem";
}

export function verdictLabel(verdict: Verdict): string {
  return verdict === "yes" ? "mogę" : "nie mogę";
}

export function peopleLabel(count: number): string {
  if (count === 1) return "1 osoba";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} osoby`;
  }
  return `${count} osób`;
}

export function slotsLabel(count: number): string {
  if (count === 1) return "1 slot";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} sloty`;
  }
  return `${count} slotów`;
}

export function durationLabel(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours > 0 && rest > 0) return `${hours} godz. ${rest} min`;
  if (hours > 0) return `${hours} godz.`;
  return `${rest} min`;
}

export function slotRangeLabel(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMins = total % 60;
  return `${time}–${endHours.toString().padStart(2, "0")}:${endMins
    .toString()
    .padStart(2, "0")}`;
}
