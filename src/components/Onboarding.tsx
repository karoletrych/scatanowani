import { useState, type FormEvent } from "react";
import { slugifyName } from "../lib/dates";
import { avatarColor } from "../lib/ui";
import type { StoreStatus } from "../lib/store";
import { HeroArt } from "./HeroArt";
import { ArrowIcon, CalendarIcon, CheckIcon, DiceIcon, SparkIcon } from "./Icons";

interface OnboardingProps {
  participants: Array<{ id: string; name: string }>;
  initialName: string;
  status: StoreStatus;
  onSubmit: (name: string) => void;
}

export function Onboarding({ participants, initialName, status, onSubmit }: OnboardingProps) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const submit = (raw: string) => {
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2) {
      setError("Wpisz imię — przynajmniej 2 znaki.");
      return;
    }
    if (!slugifyName(trimmed)) {
      setError("Imię może zawierać litery i cyfry.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(value);
  };

  const sorted = [...participants].sort((a, b) =>
    a.name.localeCompare(b.name, "pl", { sensitivity: "base" }),
  );

  return (
    <main className="onboarding">
      <div className="container onboarding-grid">
        <section className="onboarding-copy">
          <span className="eyebrow">
            <DiceIcon size={15} />
            grupa sCATANowani
          </span>
          <h1>
            Kto może
            <br />
            <em>w planszówki?</em>
          </h1>
          <p className="lede">
            Zaznacz, kiedy pasuje Ci granie. Ustaw reguły w stylu „czwartki przed 19:00
            odpadają” i dorzuć jednorazowe wyjątki. Reszta widzi wszystko na żywo.
          </p>

          <form className="enter-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Jak masz na imię?</label>
            <div className="enter-row">
              <input
                id="name"
                name="name"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
                placeholder="np. Karol"
                maxLength={30}
                autoComplete="off"
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Wchodzę
                <ArrowIcon size={17} />
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>

          {sorted.length > 0 ? (
            <div className="who-exists">
              <span>Już jesteś na liście? Kliknij swoje imię:</span>
              <div className="chips">
                {sorted.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    className="chip"
                    onClick={() => submit(participant.name)}
                  >
                    <span
                      className="chip-avatar"
                      style={{ background: avatarColor(participant.name) }}
                      aria-hidden="true"
                    >
                      {participant.name.slice(0, 1).toUpperCase()}
                    </span>
                    {participant.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <ul className="features">
            <li>
              <span className="feature-icon">
                <CalendarIcon size={18} />
              </span>
              <span>
                <strong>14 dni do przodu</strong>
                <small>Sloty co 30 minut, popołudniami</small>
              </span>
            </li>
            <li>
              <span className="feature-icon">
                <CheckIcon size={18} />
              </span>
              <span>
                <strong>Klik = odpowiedź</strong>
                <small>nie wiem → mogę → nie mogę</small>
              </span>
            </li>
            <li>
              <span className="feature-icon">
                <SparkIcon size={18} />
              </span>
              <span>
                <strong>Reguły i wyjątki</strong>
                <small>np. „czwartki do 19:00 mnie nie ma”</small>
              </span>
            </li>
          </ul>

          <p className="fineprint">
            Bez kont i haseł. Imię zapamiętamy w tej przeglądarce.
            {status === "local" ? " Tryb lokalny: dane zostają na tym urządzeniu." : ""}
          </p>
        </section>

        <div className="onboarding-art" aria-hidden="true">
          <HeroArt />
          <div className="art-caption">
            <span className="art-pill">14 dni</span>
            <span className="art-pill">30 min</span>
            <span className="art-pill">bez logowania</span>
          </div>
        </div>
      </div>
    </main>
  );
}
