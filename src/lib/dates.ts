export const PL_WEEKDAYS = [
  "niedziela",
  "poniedziałek",
  "wtorek",
  "środa",
  "czwartek",
  "piątek",
  "sobota",
] as const;

export const PL_WEEKDAYS_PLURAL = [
  "niedziele",
  "poniedziałki",
  "wtorki",
  "środy",
  "czwartki",
  "piątki",
  "soboty",
] as const;

export const PL_WEEKDAYS_SHORT = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"] as const;

const weekdayLongFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
const weekdayShortFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "short" });
const monthLongFmt = new Intl.DateTimeFormat("pl-PL", { month: "long" });
const monthShortFmt = new Intl.DateTimeFormat("pl-PL", { month: "short" });
const dayMonthFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function clean(value: string): string {
  return value.replace(/\.$/, "").trim();
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function isoRange(startISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDaysISO(startISO, index));
}

export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function fromMinutes(minutes: number): string {
  const safe = ((minutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`;
}

export function formatTime(time: string): string {
  return time;
}

export function weekdayLong(iso: string): string {
  return clean(weekdayLongFmt.format(fromISODate(iso)));
}

export function weekdayShort(iso: string): string {
  return clean(weekdayShortFmt.format(fromISODate(iso)));
}

export function formatDayLong(iso: string): string {
  return `${weekdayLong(iso)}, ${dayMonthFmt.format(fromISODate(iso))}`;
}

export function formatMonthDay(iso: string): string {
  return dayMonthFmt.format(fromISODate(iso));
}

export function formatDayShort(iso: string): string {
  const date = fromISODate(iso);
  return `${weekdayShort(iso)} ${date.getDate()}.${pad2(date.getMonth() + 1)}`;
}

export function monthLong(iso: string): string {
  return clean(monthLongFmt.format(fromISODate(iso)));
}

export function monthShort(iso: string): string {
  return clean(monthShortFmt.format(fromISODate(iso)));
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function isTomorrow(iso: string): boolean {
  return iso === addDaysISO(todayISO(), 1);
}

export function relativeDayLabel(iso: string): string | null {
  if (isToday(iso)) return "dziś";
  if (isTomorrow(iso)) return "jutro";
  return null;
}

export function timeRangeLabel(from: string, to: string): string {
  return `${from}–${to}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
