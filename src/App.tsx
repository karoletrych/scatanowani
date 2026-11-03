import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { Header, Tabs, type Tab } from "./components/Header";
import { HostPanel } from "./components/HostPanel";
import { MeepleIcon } from "./components/Icons";
import { Onboarding } from "./components/Onboarding";
import { RulesDrawer } from "./components/RulesDrawer";
import { SummaryView } from "./components/SummaryView";
import { Toast, type ToastAction } from "./components/Toast";
import {
  fillUnknown,
  progressFor,
  resolveAnswer,
  withDayCleared,
  withSlot,
  withWholeDay,
} from "./lib/availability";
import { isoRange, slugifyName, todayISO } from "./lib/dates";
import { EMPTY_ANSWERS } from "./lib/model";
import { store, useRoom } from "./lib/store";
import { slotsLabel } from "./lib/ui";
import type { ParticipantAnswers, RoomConfig, Verdict } from "./types";

const NAME_KEY = "scatanowani:name";

interface ToastState {
  message: string;
  tone: "default" | "error";
  action?: ToastAction;
}

function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function Splash({ failed }: { failed: boolean }) {
  return (
    <div className="splash" role="status">
      <span className="brand-mark brand-mark-large">
        <MeepleIcon size={34} />
      </span>
      <h1>sCATANowani</h1>
      <p>{failed ? "Nie mogę połączyć się z bazą. Sprawdź internet i odśwież." : "Rozdaję karty…"}</p>
      {failed ? (
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Spróbuj ponownie
        </button>
      ) : null}
    </div>
  );
}

export default function App() {
  const { room, status } = useRoom();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [name, setName] = useState(() => params.get("name") ?? readStoredName());
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [tab, setTab] = useState<Tab>(() => {
    const requested = params.get("tab");
    return requested === "summary" || requested === "host" ? requested : "calendar";
  });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, tone: "default" | "error" = "default", action?: ToastAction) => {
      setToast({ message, tone, action });
    },
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  const myId = name ? slugifyName(name) : "";
  const myAnswers = (room && myId ? room.answers[myId] : undefined) ?? EMPTY_ANSWERS;
  const answersRef = useRef<ParticipantAnswers>(myAnswers);

  useEffect(() => {
    answersRef.current = myAnswers;
  }, [myAnswers, myId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const dates = useMemo(
    () => isoRange(todayISO(), room?.config.horizonDays ?? 14),
    [room?.config.horizonDays],
  );

  useEffect(() => {
    if (!room || !myId || !name) return;
    if (room.participants[myId]) return;
    void store
      .saveParticipant(myId, { name, joinedAt: Date.now() })
      .catch(() => showToast("Nie udało się dodać Cię do listy.", "error"));
  }, [room, myId, name, showToast]);

  const commitAnswers = useCallback(
    (updater: (current: ParticipantAnswers) => ParticipantAnswers) => {
      if (!myId) return;
      const next = updater(answersRef.current);
      answersRef.current = next;
      void store
        .saveAnswers(myId, next)
        .catch(() => showToast("Nie udało się zapisać odpowiedzi. Sprawdź internet.", "error"));
    },
    [myId, showToast],
  );

  const handleIdentity = useCallback(
    (value: string) => {
      const id = slugifyName(value);
      if (!id) return;
      setName(value);
      setEditingIdentity(false);
      try {
        localStorage.setItem(NAME_KEY, value);
      } catch {
        // prywatny tryb przeglądarki — trudno, imię po prostu nie zostanie zapamiętane
      }
      if (!room) return;
      void store
        .saveParticipant(id, {
          name: value,
          joinedAt: room.participants[id]?.joinedAt ?? Date.now(),
        })
        .catch(() => showToast("Nie udało się dodać Cię do listy.", "error"));
    },
    [room, showToast],
  );

  const cycleSlot = useCallback(
    (date: string, time: string) => {
      const current = resolveAnswer(answersRef.current, { date, time });
      const next = current === "unknown" ? "yes" : current === "yes" ? "no" : "unknown";
      commitAnswers((answers) => withSlot(answers, { date, time }, next));
    },
    [commitAnswers],
  );

  const handleWholeDay = useCallback(
    (date: string, verdict: Verdict) => {
      if (!room) return;
      commitAnswers((answers) => withWholeDay(answers, room.config, date, verdict));
    },
    [commitAnswers, room],
  );

  const handleClearDay = useCallback(
    (date: string) => {
      commitAnswers((answers) => withDayCleared(answers, date));
    },
    [commitAnswers],
  );

  const handleFillUnknown = useCallback(
    (verdict: Verdict) => {
      if (!room) return;
      const before = answersRef.current;
      const { answers: next, changedKeys } = fillUnknown(before, room.config, dates, verdict);
      if (changedKeys.length === 0) {
        showToast("Nie ma już niewiadomych do uzupełnienia.");
        return;
      }

      commitAnswers(() => next);
      const label = verdict === "yes" ? "mogę" : "nie mogę";
      showToast(
        `Uzupełniono ${slotsLabel(changedKeys.length)} jako „${label}”.`,
        "default",
        {
          label: "Cofnij",
          onClick: () => {
            commitAnswers((current) => {
              const slots = { ...current.slots };
              for (const key of changedKeys) {
                if (slots[key] === verdict) delete slots[key];
              }
              return { ...current, slots };
            });
            showToast("Cofnięto uzupełnianie.");
          },
        },
      );
    },
    [room, dates, commitAnswers, showToast],
  );

  const handleSaveConfig = useCallback(async (config: RoomConfig) => {
    await store.saveConfig(config);
  }, []);

  const handleResetAnswers = useCallback(async () => {
    await store.clearAnswers();
  }, []);

  const handleRemoveParticipant = useCallback(async (id: string) => {
    await store.removeParticipant(id);
  }, []);

  if (!room) {
    return <Splash failed={status === "error"} />;
  }

  if (!name || editingIdentity) {
    return (
      <div className="app">
        <Onboarding
          participants={Object.entries(room.participants).map(([id, participant]) => ({
            id,
            name: participant.name,
          }))}
          initialName={name}
          status={status}
          onSubmit={handleIdentity}
        />
        {toast ? (
          <Toast
            message={toast.message}
            tone={toast.tone}
            action={toast.action}
            duration={toast.action ? 7000 : 3600}
            onClose={hideToast}
          />
        ) : null}
      </div>
    );
  }

  const config = room.config;
  const myProgress = progressFor(myAnswers, config, dates);

  return (
    <div className="app">
      <Header
        groupName={config.groupName}
        name={name}
        status={status}
        onSwitch={() => setEditingIdentity(true)}
        onHome={() => {
          setTab("calendar");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="container tabs-wrap">
        <Tabs tab={tab} onChange={setTab} />
      </div>

      <main className="container main" id="main">
        {tab === "calendar" ? (
          <CalendarView
            room={room}
            dates={dates}
            myAnswers={myAnswers}
            onCycle={cycleSlot}
            onWholeDay={handleWholeDay}
            onClearDay={handleClearDay}
            onOpenRules={() => setRulesOpen(true)}
            onFillUnknown={handleFillUnknown}
            myProgress={myProgress}
          />
        ) : null}

        {tab === "summary" ? <SummaryView room={room} dates={dates} myId={myId} /> : null}

        {tab === "host" ? (
          <HostPanel
            room={room}
            dates={dates}
            onSave={handleSaveConfig}
            onResetAnswers={handleResetAnswers}
            onRemoveParticipant={handleRemoveParticipant}
            onToast={showToast}
          />
        ) : null}
      </main>

      <footer className="site-foot container">
        <span>
          <strong>{config.groupName}</strong> · wspólna dyspozycyjność
        </span>
        <span>
          {config.place} · {config.dayStart}–{config.dayEnd} · dane synchronizują się na żywo
        </span>
      </footer>

      <RulesDrawer
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        dates={dates}
        answers={myAnswers}
        config={config}
        onChange={(next) => commitAnswers(() => next)}
        onToast={showToast}
      />

      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          action={toast.action}
          duration={toast.action ? 7000 : 3600}
          onClose={hideToast}
        />
      ) : null}
    </div>
  );
}
