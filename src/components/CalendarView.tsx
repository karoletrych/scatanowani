import type { ParticipantAnswers, RoomData, Verdict } from "../types";
import {
  bestForDay,
  dayHasAnyAnswer,
  dayHasData,
  dayOpenLabel,
  daySlotTimes,
  isSlotOpen,
  placeForDate,
  resolveAnswer,
  statForSlot,
} from "../lib/availability";
import {
  capitalize,
  formatDayLong,
  formatMonthDay,
  relativeDayLabel,
  weekdayLong,
} from "../lib/dates";
import { answerLabel, peopleLabel } from "../lib/ui";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  LockIcon,
  PinIcon,
  QuestionIcon,
  SparkIcon,
  UsersIcon,
} from "./Icons";

function answerIcon(answer: "yes" | "no" | "unknown") {
  if (answer === "yes") return <CheckIcon size={17} />;
  if (answer === "no") return <CrossIcon size={17} />;
  return <QuestionIcon size={17} />;
}

function DayCard({
  date,
  room,
  myAnswers,
  onCycle,
  onWholeDay,
  onClearDay,
}: {
  date: string;
  room: RoomData;
  myAnswers: ParticipantAnswers;
  onCycle: (date: string, time: string) => void;
  onWholeDay: (date: string, verdict: Verdict) => void;
  onClearDay: (date: string) => void;
}) {
  const config = room.config;
  const times = daySlotTimes(config);
  const isOpen = times.some((time) => isSlotOpen(config, date, time));
  const best = bestForDay(room, date);
  const hasData = dayHasData(myAnswers, date);
  const relative = relativeDayLabel(date);
  const place = placeForDate(config, date);

  return (
    <article className={`day-card ${relative ? "is-today" : ""} ${isOpen ? "" : "is-closed"}`}>
      <header className="day-head">
        <div className="day-title">
          <span className="day-weekday">{capitalize(weekdayLong(date))}</span>
          <span className="day-date">{formatMonthDay(date)}</span>
          {relative ? <span className="tag">{relative}</span> : null}
        </div>
        <div className="day-summary">
          {!isOpen ? (
            <span className="pill pill-muted">
              <LockIcon size={13} /> zamknięte
            </span>
          ) : best ? (
            <span className="pill pill-yes" title="Najlepszy slot tego dnia">
              <UsersIcon size={13} />
              {best.stat.yes}/{best.stat.total} · {best.time}
            </span>
          ) : (
            <span className="pill pill-muted">
              {dayHasAnyAnswer(room, date) ? "brak wspólnego" : "brak odpowiedzi"}
            </span>
          )}
        </div>
      </header>

      <div className="day-meta">
        <PinIcon size={13} />
        <span className="day-place">{place}</span>
        <span className="dot" aria-hidden="true">
          ·
        </span>
        <ClockIcon size={13} />
        <span>{dayOpenLabel(config, date)}</span>
      </div>

      <div className="slot-grid">
        {times.map((time) => {
          const open = isSlotOpen(config, date, time);
          const mine = resolveAnswer(myAnswers, { date, time });
          const stat = open ? statForSlot(room, { date, time }) : null;
          const label = `${formatDayLong(date)} ${time} — ${open ? answerLabel(mine) : "zamknięte"}`;

          return (
            <button
              key={time}
              type="button"
              className={`slot ${open ? `slot-${mine}` : "slot-closed"}`}
              disabled={!open}
              onClick={() => onCycle(date, time)}
              aria-label={label}
              title={
                open && stat
                  ? `${time} · ${answerLabel(mine)} · ${stat.yes}/${stat.total} może`
                  : `${time} · poza dostępnością gospodarza`
              }
            >
              <span className="slot-time">{time}</span>
              {open ? (
                <>
                  <span className="slot-icon">{answerIcon(mine)}</span>
                  {stat && stat.yes > 0 ? (
                    <span className="slot-count" aria-hidden="true">
                      {stat.yes}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="slot-icon slot-icon-lock">
                  <LockIcon size={15} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isOpen ? (
        <footer className="day-foot">
          <span className="day-foot-label">Cały dzień:</span>
          <button
            type="button"
            className="mini-btn mini-yes"
            onClick={() => onWholeDay(date, "yes")}
          >
            <CheckIcon size={14} /> mogę
          </button>
          <button
            type="button"
            className="mini-btn mini-no"
            onClick={() => onWholeDay(date, "no")}
          >
            <CrossIcon size={14} /> nie mogę
          </button>
          {hasData ? (
            <button type="button" className="mini-btn mini-clear" onClick={() => onClearDay(date)}>
              wyczyść
            </button>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}

export function CalendarView({
  room,
  dates,
  myAnswers,
  onCycle,
  onWholeDay,
  onClearDay,
  onOpenRules,
  myProgress,
}: {
  room: RoomData;
  dates: string[];
  myAnswers: ParticipantAnswers;
  onCycle: (date: string, time: string) => void;
  onWholeDay: (date: string, verdict: Verdict) => void;
  onClearDay: (date: string) => void;
  onOpenRules: () => void;
  myProgress: { answered: number; total: number; percent: number };
}) {
  const participants = Object.keys(room.participants).length;
  const first = dates[0];
  const last = dates[dates.length - 1];
  const rulesCount = myAnswers.rules.length;

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">
            <CalendarIcon size={15} />
            {first && last
              ? `${capitalize(formatMonthDay(first))} – ${formatMonthDay(last)}`
              : "najbliższe dwa tygodnie"}
          </span>
          <h1>Najbliższe dwa tygodnie</h1>
          <p className="sub">
            Klikaj kafelki: <b>nie wiem</b> → <b>mogę</b> → <b>nie mogę</b>. Kolor to Twoja
            odpowiedź, a cyfra pokazuje, ile osób może w tym czasie.
          </p>
        </div>
        <button type="button" className="btn btn-secondary rules-button" onClick={onOpenRules}>
          <SparkIcon size={17} />
          Moje reguły
          {rulesCount > 0 ? <span className="count-badge">{rulesCount}</span> : null}
        </button>
      </div>

      <div className="cal-toolbar card">
        <div className="legend" aria-label="Legenda">
          <span className="legend-item">
            <span className="legend-swatch swatch-unknown" /> nie wiem
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-yes" /> mogę
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-no" /> nie mogę
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-closed" /> zamknięte
          </span>
        </div>

        <div className="my-progress">
          <div className="my-progress-top">
            <span>
              Twoje odpowiedzi: <b>{myProgress.answered}</b> z {myProgress.total}
            </span>
            <span className="muted">{myProgress.percent}%</span>
          </div>
          <div className="progress">
            <span style={{ width: `${myProgress.percent}%` }} />
          </div>
        </div>

        <div className="people-count">
          <UsersIcon size={15} />
          {peopleLabel(participants)} w grupie
        </div>
      </div>

      <div className="days-grid">
        {dates.map((date) => (
          <DayCard
            key={date}
            date={date}
            room={room}
            myAnswers={myAnswers}
            onCycle={onCycle}
            onWholeDay={onWholeDay}
            onClearDay={onClearDay}
          />
        ))}
      </div>
    </section>
  );
}
