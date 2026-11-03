import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { RoomData, SlotStat } from "../types";
import {
  bestWindows,
  countsFor,
  daySlotTimes,
  isDateOpen,
  isSlotOpen,
  progressFor,
  statForSlot,
} from "../lib/availability";
import {
  formatDayLong,
  formatDayShort,
  formatMonthDay,
  fromMinutes,
  initials,
  toMinutes,
  weekdayShort,
} from "../lib/dates";
import { avatarColor, durationLabel, peopleLabel } from "../lib/ui";
import { CheckIcon, CrossIcon, QuestionIcon, SparkIcon, UsersIcon } from "./Icons";
import { Modal } from "./Modal";

function heatColor(ratio: number): string {
  if (ratio <= 0) return "rgba(43, 36, 26, 0.055)";
  const alpha = 0.14 + ratio * 0.76;
  return `rgba(47, 93, 58, ${alpha.toFixed(2)})`;
}

function AvatarStack({ names, limit = 3 }: { names: string[]; limit?: number }) {
  const visible = names.slice(0, limit);
  const rest = names.length - visible.length;
  return (
    <span className="avatar-stack">
      {visible.map((name) => (
        <span
          key={name}
          className="avatar avatar-small"
          style={{ background: avatarColor(name) }}
          title={name}
        >
          {initials(name)}
        </span>
      ))}
      {rest > 0 ? <span className="avatar avatar-small avatar-rest">+{rest}</span> : null}
    </span>
  );
}

function PeopleGroup({
  title,
  names,
  tone,
  icon,
}: {
  title: string;
  names: string[];
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className={`people-group people-group-${tone}`}>
      <h4>
        {icon}
        {title}
        <span>{names.length}</span>
      </h4>
      {names.length > 0 ? (
        <ul>
          {names.map((name) => (
            <li key={name}>
              <span className="avatar avatar-small" style={{ background: avatarColor(name) }}>
                {initials(name)}
              </span>
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">nikt</p>
      )}
    </div>
  );
}

export function SummaryView({ room, dates, myId }: { room: RoomData; dates: string[]; myId: string }) {
  const [selected, setSelected] = useState<{ date: string; from: string; to: string } | null>(null);
  const best = useMemo(() => bestWindows(room, dates, 6), [room, dates]);
  const times = daySlotTimes(room.config);
  const participants = Object.entries(room.participants)
    .map(([id, participant]) => {
      const answers = room.answers[id];
      return {
        id,
        name: participant.name,
        progress: progressFor(answers, room.config, dates),
        counts: countsFor(answers, room.config, dates),
      };
    })
    .sort((a, b) => b.progress.answered - a.progress.answered || a.name.localeCompare(b.name, "pl"));

  const selectedStat: SlotStat | null = selected
    ? statForSlot(room, { date: selected.date, time: selected.from })
    : null;

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">
            <UsersIcon size={15} />
            wspólny obraz
          </span>
          <h1>Kto może i kiedy</h1>
          <p className="sub">
            Najlepsze terminy, mapa dostępności i to, kto już wypełnił swoją część.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <section className="card best-card">
          <header className="card-head">
            <h2>
              <SparkIcon size={18} /> Najlepsze terminy
            </h2>
            <span className="card-note">najwięcej „mogę”</span>
          </header>

          {best.length === 0 ? (
            <p className="empty-state">
              Jeszcze nikt nie zaznaczył „mogę”. Gdy pojawią się odpowiedzi, tutaj wyrosną
              najlepsze terminy.
            </p>
          ) : (
            <>
              <ul className="best-list">
                {best.map((entry) => {
                  const percent = entry.stat.total
                    ? Math.round((entry.stat.yes / entry.stat.total) * 100)
                    : 0;
                  const all = entry.stat.total > 0 && entry.stat.yes === entry.stat.total;
                  return (
                    <li key={`${entry.date}-${entry.time}`}>
                      <button
                        type="button"
                        className="best-row"
                        onClick={() =>
                          setSelected({ date: entry.date, from: entry.time, to: entry.to })
                        }
                      >
                        <span className="best-date">
                          <strong>{weekdayShort(entry.date)}</strong>
                          <span>{formatMonthDay(entry.date)}</span>
                        </span>
                        <span className="best-time">
                          <strong>
                            {entry.time}–{entry.to}
                          </strong>
                          <small>
                            {entry.stat.yes}/{entry.stat.total} · {peopleLabel(entry.stat.yes)} ·{" "}
                            {durationLabel(entry.slotCount * room.config.slotMinutes)}
                          </small>
                        </span>
                        <span className="best-people">
                          <AvatarStack names={entry.stat.yesNames} />
                          {all ? <span className="pill pill-yes">wszyscy</span> : null}
                        </span>
                        <span className="best-bar" aria-hidden="true">
                          <span style={{ width: `${percent}%` }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="best-foot">
                Zakresy, w których przez cały czas może ta sama grupa (min. 2 osoby). Pełna
                mapa poniżej.
              </p>
            </>
          )}
        </section>

        <section className="card progress-card">
          <header className="card-head">
            <h2>
              <UsersIcon size={18} /> Kto wypełnił
            </h2>
            <span className="card-note">{peopleLabel(participants.length)}</span>
          </header>

          {participants.length === 0 ? (
            <p className="empty-state">Nikogo jeszcze nie ma. Wyślij link znajomym.</p>
          ) : (
            <ul className="progress-list">
              {participants.map((person) => (
                <li key={person.id}>
                  <span
                    className="avatar"
                    style={{ background: avatarColor(person.name) }}
                    aria-hidden="true"
                  >
                    {initials(person.name)}
                  </span>
                  <div className="progress-person">
                    <div className="progress-name">
                      <strong>{person.name}</strong>
                      {person.id === myId ? <span className="you">to Ty</span> : null}
                    </div>
                    <div className="progress">
                      <span style={{ width: `${person.progress.percent}%` }} />
                    </div>
                    <span className="progress-detail">
                      <span className="dot dot-yes" /> {person.counts.yes} mogę
                      <span className="dot dot-no" /> {person.counts.no} nie
                      <span className="dot dot-unknown" />{" "}
                      {person.counts.unknown} nie wiem
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card heat-card">
        <header className="card-head">
          <h2>Mapa dostępności</h2>
          <span className="heat-legend">
            mniej
            <span className="heat-legend-bar" />
            więcej
          </span>
        </header>
        <p className="card-note heat-note">
          Kliknij kafelek, żeby zobaczyć, kto może, kto nie może i kto jeszcze nie wie.
        </p>

        <div className="heat-scroll">
          <div
            className="heat-grid"
            style={{ gridTemplateColumns: `104px repeat(${times.length}, minmax(36px, 1fr))` }}
          >
            <div className="heat-corner" />
            {times.map((time) => (
              <div key={time} className="heat-time">
                {time.endsWith(":00") ? time.slice(0, 2) : ""}
              </div>
            ))}

            {dates.map((date) => {
              const open = isDateOpen(room.config, date);
              return (
                <Fragment key={date}>
                  <div className={`heat-day ${open ? "" : "is-closed"}`}>
                    {formatDayShort(date)}
                  </div>
                  {times.map((time) => {
                    const slotOpen = isSlotOpen(room.config, date, time);
                    if (!slotOpen) {
                      return <div key={time} className="heat-cell heat-cell-closed" aria-hidden="true" />;
                    }
                    const stat = statForSlot(room, { date, time });
                    const ratio = stat.total > 0 ? stat.yes / stat.total : 0;
                    return (
                      <button
                        key={time}
                        type="button"
                        className={`heat-cell ${stat.total > 0 && stat.yes === stat.total ? "is-full" : ""}`}
                        style={{ background: heatColor(ratio) }}
                        onClick={() =>
                          setSelected({
                            date,
                            from: time,
                            to: fromMinutes(toMinutes(time) + room.config.slotMinutes),
                          })
                        }
                        aria-label={`${formatDayLong(date)} ${time}: ${stat.yes} z ${stat.total} może`}
                        title={`${formatDayLong(date)} ${time} — ${stat.yes}/${stat.total} może`}
                      />
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {selected && selectedStat ? (
        <Modal
          title={`${formatDayLong(selected.date)}, ${selected.from}–${selected.to}`}
          subtitle={`${selectedStat.yes} z ${selectedStat.total} może · ${durationLabel(
            toMinutes(selected.to) - toMinutes(selected.from),
          )}`}
          onClose={() => setSelected(null)}
        >
          <div className="who-groups">
            <PeopleGroup
              title="Mogą"
              tone="yes"
              names={selectedStat.yesNames}
              icon={<CheckIcon size={15} />}
            />
            <PeopleGroup
              title="Nie mogą"
              tone="no"
              names={selectedStat.noNames}
              icon={<CrossIcon size={15} />}
            />
            <PeopleGroup
              title="Nie wiedzą"
              tone="unknown"
              names={selectedStat.unknownNames}
              icon={<QuestionIcon size={15} />}
            />
          </div>
          <p className="modal-note">
            Swoją odpowiedź zmienisz w widoku <strong>Kalendarz</strong> — klikając ten slot.
          </p>
        </Modal>
      ) : null}
    </section>
  );
}
