import { useEffect, useState } from "react";
import type { ParticipantAnswers, RoomConfig, Verdict } from "../types";
import { createId } from "../lib/model";
import {
  PL_WEEKDAYS_PLURAL,
  PL_WEEKDAYS_SHORT,
  capitalize,
  formatDayShort,
  toMinutes,
} from "../lib/dates";
import { verdictLabel } from "../lib/ui";
import {
  CheckIcon,
  CloseIcon,
  CrossIcon,
  InfoIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from "./Icons";

export function RulesDrawer({
  open,
  onClose,
  dates,
  answers,
  config,
  onChange,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  dates: string[];
  answers: ParticipantAnswers;
  config: RoomConfig;
  onChange: (next: ParticipantAnswers) => void;
  onToast: (message: string) => void;
}) {
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [ruleFrom, setRuleFrom] = useState(config.dayStart);
  const [ruleTo, setRuleTo] = useState(config.dayEnd);
  const [ruleVerdict, setRuleVerdict] = useState<Verdict>("no");

  const [exceptionDate, setExceptionDate] = useState(dates[0] ?? "");
  const [exceptionFrom, setExceptionFrom] = useState(config.dayStart);
  const [exceptionTo, setExceptionTo] = useState(config.dayEnd);
  const [exceptionVerdict, setExceptionVerdict] = useState<Verdict>("no");

  const [error, setError] = useState<string | null>(null);
  const firstDate = dates[0] ?? "";

  useEffect(() => {
    if (!open) return;
    setRuleFrom(config.dayStart);
    setRuleTo(config.dayEnd);
    setExceptionFrom(config.dayStart);
    setExceptionTo(config.dayEnd);
    setExceptionDate((current) => current || firstDate);
    setError(null);
  }, [open, config.dayStart, config.dayEnd, firstDate]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday],
    );
  };

  const addRule = () => {
    if (weekdays.length === 0) {
      setError("Wybierz przynajmniej jeden dzień tygodnia.");
      return;
    }
    if (!ruleFrom || !ruleTo || toMinutes(ruleFrom) >= toMinutes(ruleTo)) {
      setError("Godzina „do” musi być później niż „od”.");
      return;
    }
    const rules = [
      ...answers.rules,
      ...weekdays.map((weekday) => ({
        id: createId(),
        weekday,
        from: ruleFrom,
        to: ruleTo,
        verdict: ruleVerdict,
      })),
    ];
    onChange({ ...answers, rules });
    setWeekdays([]);
    setError(null);
    onToast("Reguła dodana — działa od razu.");
  };

  const addException = () => {
    if (!exceptionDate) {
      setError("Wybierz datę wyjątku.");
      return;
    }
    if (!exceptionFrom || !exceptionTo || toMinutes(exceptionFrom) >= toMinutes(exceptionTo)) {
      setError("Godzina „do” musi być później niż „od”.");
      return;
    }
    const exceptions = [
      ...answers.exceptions,
      {
        id: createId(),
        date: exceptionDate,
        from: exceptionFrom,
        to: exceptionTo,
        verdict: exceptionVerdict,
      },
    ];
    onChange({ ...answers, exceptions });
    setError(null);
    onToast("Wyjątek dodany.");
  };

  const removeRule = (id: string) => {
    onChange({ ...answers, rules: answers.rules.filter((rule) => rule.id !== id) });
  };

  const removeException = (id: string) => {
    onChange({
      ...answers,
      exceptions: answers.exceptions.filter((exception) => exception.id !== id),
    });
  };

  const sortedRules = [...answers.rules].sort(
    (a, b) => a.weekday - b.weekday || toMinutes(a.from) - toMinutes(b.from),
  );
  const sortedExceptions = [...answers.exceptions].sort(
    (a, b) => a.date.localeCompare(b.date) || toMinutes(a.from) - toMinutes(b.from),
  );

  return (
    <div
      className="overlay drawer-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Moje reguły">
        <header className="drawer-head">
          <div>
            <span className="eyebrow">
              <SparkIcon size={15} /> automatyka
            </span>
            <h2>Moje reguły</h2>
            <p>Ustaw raz, działa w tle. Kliknięty slot zawsze ma pierwszeństwo.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <CloseIcon />
          </button>
        </header>

        <div className="drawer-body">
          <section className="rule-section">
            <h3>Reguły cykliczne</h3>
            <p className="hint">Np. „nie mogę w każdy czwartek do 19:00”.</p>

            <div className="weekday-picker" role="group" aria-label="Dni tygodnia">
              {PL_WEEKDAYS_SHORT.map((short, weekday) => (
                <button
                  key={short}
                  type="button"
                  className={`weekday ${weekdays.includes(weekday) ? "is-active" : ""}`}
                  onClick={() => toggleWeekday(weekday)}
                  aria-pressed={weekdays.includes(weekday)}
                >
                  {short}
                </button>
              ))}
            </div>

            <div className="time-row">
              <label>
                od
                <input
                  type="time"
                  step={300}
                  value={ruleFrom}
                  onChange={(event) => setRuleFrom(event.target.value)}
                />
              </label>
              <label>
                do
                <input
                  type="time"
                  step={300}
                  value={ruleTo}
                  onChange={(event) => setRuleTo(event.target.value)}
                />
              </label>
            </div>

            <div className="verdict-toggle" role="group" aria-label="Rodzaj reguły">
              <button
                type="button"
                className={`verdict verdict-no ${ruleVerdict === "no" ? "is-active" : ""}`}
                onClick={() => setRuleVerdict("no")}
                aria-pressed={ruleVerdict === "no"}
              >
                <CrossIcon size={15} /> Nie mogę
              </button>
              <button
                type="button"
                className={`verdict verdict-yes ${ruleVerdict === "yes" ? "is-active" : ""}`}
                onClick={() => setRuleVerdict("yes")}
                aria-pressed={ruleVerdict === "yes"}
              >
                <CheckIcon size={15} /> Mogę
              </button>
            </div>

            <button type="button" className="btn btn-primary btn-block" onClick={addRule}>
              <PlusIcon size={17} /> Dodaj regułę
            </button>

            {sortedRules.length > 0 ? (
              <ul className="rule-list">
                {sortedRules.map((rule) => (
                  <li key={rule.id}>
                    <span className={`rule-dot rule-dot-${rule.verdict}`} />
                    <div className="rule-text">
                      <strong>
                        {capitalize(PL_WEEKDAYS_PLURAL[rule.weekday] ?? "")} · {rule.from}–
                        {rule.to}
                      </strong>
                      <small>{verdictLabel(rule.verdict)}</small>
                    </div>
                    <button
                      type="button"
                      className="icon-btn icon-btn-small"
                      onClick={() => removeRule(rule.id)}
                      aria-label="Usuń regułę"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-hint">Nie masz jeszcze reguł.</p>
            )}
          </section>

          <section className="rule-section">
            <h3>Jednorazowe wyjątki</h3>
            <p className="hint">Konkretna data, np. „6 listopada nie mogę”.</p>

            <label className="field">
              Dzień
              <select
                value={exceptionDate}
                onChange={(event) => setExceptionDate(event.target.value)}
              >
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {formatDayShort(date)}
                  </option>
                ))}
              </select>
            </label>

            <div className="time-row">
              <label>
                od
                <input
                  type="time"
                  step={300}
                  value={exceptionFrom}
                  onChange={(event) => setExceptionFrom(event.target.value)}
                />
              </label>
              <label>
                do
                <input
                  type="time"
                  step={300}
                  value={exceptionTo}
                  onChange={(event) => setExceptionTo(event.target.value)}
                />
              </label>
            </div>

            <div className="verdict-toggle" role="group" aria-label="Rodzaj wyjątku">
              <button
                type="button"
                className={`verdict verdict-no ${exceptionVerdict === "no" ? "is-active" : ""}`}
                onClick={() => setExceptionVerdict("no")}
                aria-pressed={exceptionVerdict === "no"}
              >
                <CrossIcon size={15} /> Nie mogę
              </button>
              <button
                type="button"
                className={`verdict verdict-yes ${exceptionVerdict === "yes" ? "is-active" : ""}`}
                onClick={() => setExceptionVerdict("yes")}
                aria-pressed={exceptionVerdict === "yes"}
              >
                <CheckIcon size={15} /> Mogę
              </button>
            </div>

            <button type="button" className="btn btn-secondary btn-block" onClick={addException}>
              <PlusIcon size={17} /> Dodaj wyjątek
            </button>

            {sortedExceptions.length > 0 ? (
              <ul className="rule-list">
                {sortedExceptions.map((exception) => (
                  <li key={exception.id}>
                    <span className={`rule-dot rule-dot-${exception.verdict}`} />
                    <div className="rule-text">
                      <strong>
                        {formatDayShort(exception.date)} · {exception.from}–{exception.to}
                      </strong>
                      <small>{verdictLabel(exception.verdict)}</small>
                    </div>
                    <button
                      type="button"
                      className="icon-btn icon-btn-small"
                      onClick={() => removeException(exception.id)}
                      aria-label="Usuń wyjątek"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-hint">Brak jednorazowych wyjątków.</p>
            )}
          </section>

          {error ? <p className="form-error">{error}</p> : null}

          <p className="precedence">
            <InfoIcon size={16} />
            Kolejność: kliknięty slot → wyjątek jednorazowy → reguła cykliczna. Godziny
            dotyczą startu slotu.
          </p>
        </div>
      </aside>
    </div>
  );
}
