import { useEffect, useMemo, useState } from "react";
import type { DayOverride, OpenWindow, RoomConfig, RoomData } from "../types";
import {
  PL_WEEKDAYS,
  capitalize,
  formatDayShort,
  formatMonthDay,
  toMinutes,
} from "../lib/dates";
import { initials } from "../lib/dates";
import { avatarColor, peopleLabel } from "../lib/ui";
import {
  CheckIcon,
  ClockIcon,
  CrownIcon,
  InfoIcon,
  PlusIcon,
  RefreshIcon,
  SettingsIcon,
  TrashIcon,
  UsersIcon,
} from "./Icons";

type DayMode = "template" | "custom" | "closed";

function dayMode(override: DayOverride | undefined): DayMode {
  if (override?.closed) return "closed";
  if (override?.from && override?.to) return "custom";
  return "template";
}

export function HostPanel({
  room,
  dates,
  onSave,
  onResetAnswers,
  onRemoveParticipant,
  onToast,
}: {
  room: RoomData;
  dates: string[];
  onSave: (config: RoomConfig) => Promise<void>;
  onResetAnswers: () => Promise<void>;
  onRemoveParticipant: (id: string) => Promise<void>;
  onToast: (message: string, tone?: "default" | "error") => void;
}) {
  const config = room.config;
  const [draft, setDraft] = useState<RoomConfig>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config]);
  const participants = Object.entries(room.participants).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "pl", { sensitivity: "base" }),
  );

  const updateWindow = (index: number, patch: Partial<OpenWindow>) => {
    setDraft((current) => ({
      ...current,
      openWindows: current.openWindows.map((window, position) =>
        position === index ? { ...window, ...patch } : window,
      ),
    }));
  };

  const addWindow = () => {
    setDraft((current) => ({
      ...current,
      openWindows: [
        ...current.openWindows,
        { weekday: 5, from: current.dayStart, to: current.dayEnd },
      ],
    }));
  };

  const removeWindow = (index: number) => {
    setDraft((current) => ({
      ...current,
      openWindows: current.openWindows.filter((_, position) => position !== index),
    }));
  };

  const updateOverride = (date: string, updater: (value: DayOverride) => DayOverride) => {
    setDraft((current) => {
      const overrides = { ...current.dayOverrides };
      const next = updater(overrides[date] ?? {});
      if (next.closed || next.from || next.to || next.place) {
        overrides[date] = next;
      } else {
        delete overrides[date];
      }
      return { ...current, dayOverrides: overrides };
    });
  };

  const setMode = (date: string, mode: DayMode) => {
    updateOverride(date, (previous) => {
      if (mode === "closed") {
        return { closed: true, ...(previous.place ? { place: previous.place } : {}) };
      }
      if (mode === "custom") {
        return {
          from: previous.from ?? draft.dayStart,
          to: previous.to ?? draft.dayEnd,
          ...(previous.place ? { place: previous.place } : {}),
        };
      }
      return {};
    });
  };

  const save = async () => {
    const badWindow = draft.openWindows.some(
      (window) => !window.from || !window.to || toMinutes(window.from) >= toMinutes(window.to),
    );
    if (badWindow) {
      setError("Każde okno musi mieć godzinę „do” późniejszą niż „od”.");
      return;
    }
    if (toMinutes(draft.dayStart) >= toMinutes(draft.dayEnd)) {
      setError("Zakres dnia musi kończyć się później, niż zaczyna.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(draft);
      onToast("Ustawienia zapisane.");
    } catch (saveError) {
      console.error(saveError);
      onToast("Nie udało się zapisać ustawień.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">
            <CrownIcon size={15} />
            panel gospodarza
          </span>
          <h1>Kiedy w ogóle gramy</h1>
          <p className="sub">
            Ustawiasz okna, w których spotkania mają sens. Poza nimi sloty są zablokowane i nie
            liczą się do podsumowań.
          </p>
        </div>
      </div>

      <div className="host-warning">
        <InfoIcon size={18} />
        <div>
          <strong>Panel jest otwarty dla wszystkich z linkiem.</strong>
          <span> Tak ustaliliśmy — bez haseł i kont. Zmiany i tak zobaczysz przed zapisaniem.</span>
        </div>
      </div>

      <div className="host-grid">
        <section className="card host-section">
          <header className="card-head">
            <h2>
              <ClockIcon size={18} /> Okna dostępności
            </h2>
            <span className="card-note">tydzień w tydzień</span>
          </header>
          <p className="card-note">
            Np. „gramy w tygodniu 17:00–22:00”. To nie jest jeszcze deklaracja, tylko siatka
            terminów dla całej grupy.
          </p>

          <div className="window-list">
            {draft.openWindows.map((window, index) => (
              <div className="window-row" key={`${window.weekday}-${index}`}>
                <select
                  value={window.weekday}
                  onChange={(event) => updateWindow(index, { weekday: Number(event.target.value) })}
                  aria-label="Dzień tygodnia"
                >
                  {PL_WEEKDAYS.map((label, weekday) => (
                    <option key={label} value={weekday}>
                      {capitalize(label)}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  step={300}
                  value={window.from}
                  onChange={(event) => updateWindow(index, { from: event.target.value })}
                  aria-label="Od"
                />
                <span className="dash">–</span>
                <input
                  type="time"
                  step={300}
                  value={window.to}
                  onChange={(event) => updateWindow(index, { to: event.target.value })}
                  aria-label="Do"
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-small"
                  onClick={() => removeWindow(index)}
                  aria-label="Usuń okno"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-secondary" onClick={addWindow}>
            <PlusIcon size={16} /> Dodaj okno
          </button>
          {draft.openWindows.length === 0 ? (
            <p className="form-error">Bez żadnego okna kalendarz będzie pusty.</p>
          ) : null}
        </section>

        <section className="card host-section">
          <header className="card-head">
            <h2>
              <SettingsIcon size={18} /> Ustawienia grupy
            </h2>
          </header>

          <div className="field-grid">
            <label className="field">
              Nazwa grupy
              <input
                type="text"
                value={draft.groupName}
                maxLength={40}
                onChange={(event) => setDraft({ ...draft, groupName: event.target.value })}
              />
            </label>
            <label className="field">
              Domyślne miejsce
              <input
                type="text"
                value={draft.place}
                maxLength={60}
                onChange={(event) => setDraft({ ...draft, place: event.target.value })}
              />
            </label>
            <label className="field">
              Start dnia
              <input
                type="time"
                step={300}
                value={draft.dayStart}
                onChange={(event) => setDraft({ ...draft, dayStart: event.target.value })}
              />
            </label>
            <label className="field">
              Koniec dnia
              <input
                type="time"
                step={300}
                value={draft.dayEnd}
                onChange={(event) => setDraft({ ...draft, dayEnd: event.target.value })}
              />
            </label>
            <label className="field">
              Długość slotu
              <select
                value={draft.slotMinutes}
                onChange={(event) =>
                  setDraft({ ...draft, slotMinutes: Number(event.target.value) })
                }
              >
                <option value={15}>15 minut</option>
                <option value={30}>30 minut</option>
                <option value={60}>60 minut</option>
              </select>
            </label>
            <label className="field">
              Horyzont
              <select
                value={draft.horizonDays}
                onChange={(event) =>
                  setDraft({ ...draft, horizonDays: Number(event.target.value) })
                }
              >
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={21}>21 dni</option>
                <option value={28}>28 dni</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <section className="card host-section">
        <header className="card-head">
          <h2>Wyjątki w kalendarzu</h2>
          <span className="card-note">{dates.length} dni do przodu</span>
        </header>
        <p className="card-note">
          Zamknij pojedynczy dzień albo ustaw dla niego inne godziny lub miejsce.
        </p>

        <div className="override-list">
          {dates.map((date) => {
            const override = draft.dayOverrides[date];
            const mode = dayMode(override);
            return (
              <div className={`override-row mode-${mode}`} key={date}>
                <div className="override-day">
                  <strong>{formatDayShort(date)}</strong>
                  <small>{formatMonthDay(date)}</small>
                </div>

                <select
                  value={mode}
                  onChange={(event) => setMode(date, event.target.value as DayMode)}
                  aria-label={`Tryb dnia ${formatDayShort(date)}`}
                >
                  <option value="template">wg szablonu</option>
                  <option value="custom">własne godziny</option>
                  <option value="closed">zamknięte</option>
                </select>

                {mode === "custom" ? (
                  <div className="override-times">
                    <input
                      type="time"
                      step={300}
                      value={override?.from ?? draft.dayStart}
                      onChange={(event) =>
                        updateOverride(date, (previous) => ({
                          ...previous,
                          from: event.target.value,
                          to: previous.to ?? draft.dayEnd,
                        }))
                      }
                      aria-label="Od"
                    />
                    <span className="dash">–</span>
                    <input
                      type="time"
                      step={300}
                      value={override?.to ?? draft.dayEnd}
                      onChange={(event) =>
                        updateOverride(date, (previous) => ({
                          ...previous,
                          from: previous.from ?? draft.dayStart,
                          to: event.target.value,
                        }))
                      }
                      aria-label="Do"
                    />
                  </div>
                ) : (
                  <span className="override-times-placeholder" />
                )}

                <input
                  className="override-place"
                  type="text"
                  placeholder={`miejsce: ${draft.place}`}
                  value={override?.place ?? ""}
                  maxLength={60}
                  onChange={(event) =>
                    updateOverride(date, (previous) => ({
                      ...previous,
                      place: event.target.value || undefined,
                    }))
                  }
                  aria-label={`Miejsce ${formatDayShort(date)}`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="card host-section">
        <header className="card-head">
          <h2>
            <UsersIcon size={18} /> Odpowiedzi i osoby
          </h2>
          <span className="card-note">{peopleLabel(participants.length)}</span>
        </header>

        {participants.length === 0 ? (
          <p className="empty-state">Jeszcze nikogo nie ma na liście.</p>
        ) : (
          <ul className="host-people">
            {participants.map(([id, participant]) => (
              <li key={id}>
                <span
                  className="avatar avatar-small"
                  style={{ background: avatarColor(participant.name) }}
                  aria-hidden="true"
                >
                  {initials(participant.name)}
                </span>
                <span className="host-person-name">{participant.name}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn-small"
                  onClick={async () => {
                    if (!window.confirm(`Usunąć ${participant.name} razem z odpowiedziami?`)) return;
                    try {
                      await onRemoveParticipant(id);
                      onToast(`Usunięto ${participant.name}.`);
                    } catch (removeError) {
                      console.error(removeError);
                      onToast("Nie udało się usunąć osoby.", "error");
                    }
                  }}
                  aria-label={`Usuń ${participant.name}`}
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="danger-zone">
          <div>
            <strong>Wyczyść wszystkie odpowiedzi</strong>
            <span>Osoby zostaną na liście, ale ich dyspozycyjność zniknie.</span>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              if (!window.confirm("Na pewno usunąć wszystkie odpowiedzi? Tego nie da się cofnąć.")) {
                return;
              }
              try {
                await onResetAnswers();
                onToast("Wyczyszczono odpowiedzi.");
              } catch (resetError) {
                console.error(resetError);
                onToast("Nie udało się wyczyścić odpowiedzi.", "error");
              }
            }}
          >
            <RefreshIcon size={16} /> Wyczyść
          </button>
        </div>
      </section>

      {error ? <p className="form-error host-error">{error}</p> : null}

      <div className="save-bar">
        <span className={dirty ? "is-dirty" : ""}>
          {dirty ? "Masz niezapisane zmiany" : "Wszystko zapisane"}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setDraft(config)}
          disabled={!dirty || saving}
        >
          Cofnij
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={!dirty || saving}
        >
          <CheckIcon size={17} /> {saving ? "Zapisuję…" : "Zapisz ustawienia"}
        </button>
      </div>
    </section>
  );
}
