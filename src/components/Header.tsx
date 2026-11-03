import type { ReactNode } from "react";
import { initials } from "../lib/dates";
import type { StoreStatus } from "../lib/store";
import { CalendarIcon, CrownIcon, MeepleIcon, UsersIcon } from "./Icons";

export type Tab = "calendar" | "summary" | "host";

const STATUS_LABEL: Record<StoreStatus, string> = {
  connecting: "łączenie…",
  live: "na żywo",
  error: "brak połączenia",
  local: "tryb lokalny",
};

export function StatusPill({ status }: { status: StoreStatus }) {
  return (
    <span className={`status status-${status}`} title={statusTitle(status)}>
      <span className="status-dot" />
      <span className="status-text">{STATUS_LABEL[status]}</span>
    </span>
  );
}

function statusTitle(status: StoreStatus): string {
  if (status === "live") return "Zmiany innych osób pojawiają się od razu.";
  if (status === "local") return "Dane zapisują się tylko w tej przeglądarce.";
  if (status === "error") return "Nie udało się połączyć z bazą. Sprawdź internet.";
  return "Łączę z bazą…";
}

export function Header({
  groupName,
  name,
  status,
  onSwitch,
  onHome,
}: {
  groupName: string;
  name: string;
  status: StoreStatus;
  onSwitch: () => void;
  onHome: () => void;
}) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <button type="button" className="brand" onClick={onHome} aria-label="Przejdź do kalendarza">
          <span className="brand-mark" aria-hidden="true">
            <MeepleIcon size={22} />
          </span>
          <span className="brand-text">
            <strong>{groupName}</strong>
            <small>planszówki bez spiny</small>
          </span>
        </button>

        <div className="topbar-right">
          <StatusPill status={status} />
          <button type="button" className="user-chip" onClick={onSwitch} title="Zmień osobę">
            <span className="avatar" style={{ background: "var(--forest)" }} aria-hidden="true">
              {initials(name)}
            </span>
            <span className="user-name">{name}</span>
            <span className="user-switch">Zmień</span>
          </button>
        </div>
      </div>
    </header>
  );
}

const TABS: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  { id: "calendar", label: "Kalendarz", icon: <CalendarIcon size={17} /> },
  { id: "summary", label: "Wszyscy", icon: <UsersIcon size={17} /> },
  { id: "host", label: "Gospodarz", icon: <CrownIcon size={17} /> },
];

export function Tabs({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="tabs" role="tablist" aria-label="Widoki">
      {TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          className={`tab ${tab === item.id ? "is-active" : ""}`}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
