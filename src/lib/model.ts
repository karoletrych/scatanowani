import type {
  DayOverride,
  OneOff,
  OpenWindow,
  ParticipantAnswers,
  RecurringRule,
  RoomConfig,
  RoomData,
  Verdict,
} from "../types";

export const DEFAULT_CONFIG: RoomConfig = {
  groupName: "sCATANowani",
  place: "U gospodarza",
  dayStart: "17:00",
  dayEnd: "22:00",
  slotMinutes: 30,
  horizonDays: 14,
  openWindows: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    from: "17:00",
    to: "22:00",
  })),
  dayOverrides: {},
};

export const EMPTY_ANSWERS: ParticipantAnswers = {
  slots: {},
  rules: [],
  exceptions: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTime(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return fallback;
  return `${hours.toString().padStart(2, "0")}:${match[2]}`;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeWindow(raw: unknown): OpenWindow | null {
  if (!isRecord(raw)) return null;
  const weekday = asNumber(raw.weekday, -1);
  if (weekday < 0 || weekday > 6) return null;
  return {
    weekday,
    from: asTime(raw.from, "17:00"),
    to: asTime(raw.to, "22:00"),
  };
}

function normalizeOverride(raw: unknown): DayOverride {
  if (!isRecord(raw)) return {};
  const override: DayOverride = {};
  if (raw.closed === true) override.closed = true;
  if (typeof raw.from === "string") override.from = asTime(raw.from, "17:00");
  if (typeof raw.to === "string") override.to = asTime(raw.to, "22:00");
  if (typeof raw.place === "string" && raw.place.trim()) override.place = raw.place.trim();
  return override;
}

export function normalizeConfig(raw: unknown): RoomConfig {
  if (!isRecord(raw)) return { ...DEFAULT_CONFIG, dayOverrides: {} };
  const windowsRaw = Array.isArray(raw.openWindows) ? raw.openWindows : DEFAULT_CONFIG.openWindows;
  const openWindows = windowsRaw
    .map(normalizeWindow)
    .filter((window): window is OpenWindow => window !== null);

  const overridesRaw = isRecord(raw.dayOverrides) ? raw.dayOverrides : {};
  const dayOverrides: Record<string, DayOverride> = {};
  for (const [date, value] of Object.entries(overridesRaw)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) dayOverrides[date] = normalizeOverride(value);
  }

  return {
    groupName:
      typeof raw.groupName === "string" && raw.groupName.trim()
        ? raw.groupName.trim()
        : DEFAULT_CONFIG.groupName,
    place:
      typeof raw.place === "string" && raw.place.trim() ? raw.place.trim() : DEFAULT_CONFIG.place,
    dayStart: asTime(raw.dayStart, DEFAULT_CONFIG.dayStart),
    dayEnd: asTime(raw.dayEnd, DEFAULT_CONFIG.dayEnd),
    slotMinutes: [15, 30, 60].includes(asNumber(raw.slotMinutes, 30))
      ? asNumber(raw.slotMinutes, 30)
      : 30,
    horizonDays: Math.min(28, Math.max(7, asNumber(raw.horizonDays, 14))),
    openWindows: openWindows.length ? openWindows : DEFAULT_CONFIG.openWindows,
    dayOverrides,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

export function normalizeAnswers(raw: unknown): ParticipantAnswers {
  if (!isRecord(raw)) return { ...EMPTY_ANSWERS, slots: {}, rules: [], exceptions: [] };

  const slots: Record<string, Verdict> = {};
  if (isRecord(raw.slots)) {
    for (const [key, value] of Object.entries(raw.slots)) {
      if (value === "yes" || value === "no") slots[key] = value;
    }
  }

  const rules: RecurringRule[] = Array.isArray(raw.rules)
    ? raw.rules.flatMap((rule) => {
        if (!isRecord(rule)) return [];
        const weekday = asNumber(rule.weekday, -1);
        if (weekday < 0 || weekday > 6) return [];
        if (rule.verdict !== "yes" && rule.verdict !== "no") return [];
        return [
          {
            id: typeof rule.id === "string" ? rule.id : createId(),
            weekday,
            from: asTime(rule.from, "17:00"),
            to: asTime(rule.to, "22:00"),
            verdict: rule.verdict,
          },
        ];
      })
    : [];

  const exceptions: OneOff[] = Array.isArray(raw.exceptions)
    ? raw.exceptions.flatMap((exception) => {
        if (!isRecord(exception) || typeof exception.date !== "string") return [];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.date)) return [];
        if (exception.verdict !== "yes" && exception.verdict !== "no") return [];
        return [
          {
            id: typeof exception.id === "string" ? exception.id : createId(),
            date: exception.date,
            from: asTime(exception.from, "17:00"),
            to: asTime(exception.to, "22:00"),
            verdict: exception.verdict,
          },
        ];
      })
    : [];

  return {
    slots,
    rules,
    exceptions,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

export function normalizeRoom(raw: unknown): RoomData {
  if (!isRecord(raw)) {
    return { config: normalizeConfig(null), participants: {}, answers: {} };
  }
  const participants: RoomData["participants"] = {};
  if (isRecord(raw.participants)) {
    for (const [id, value] of Object.entries(raw.participants)) {
      if (!isRecord(value) || typeof value.name !== "string") continue;
      participants[id] = {
        name: value.name.trim().slice(0, 40) || id,
        joinedAt: asNumber(value.joinedAt, Date.now()),
      };
    }
  }
  const answers: RoomData["answers"] = {};
  if (isRecord(raw.answers)) {
    for (const [id, value] of Object.entries(raw.answers)) {
      answers[id] = normalizeAnswers(value);
    }
  }
  return { config: normalizeConfig(raw.config), participants, answers };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}
