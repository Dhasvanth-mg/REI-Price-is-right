"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Users,
  Clock3,
  Trophy,
  Settings2,
  LayoutGrid,
  LogOut,
  Plus,
  Check,
  LockKeyhole,
  Play,
  Pause,
  Eye,
  Copy,
  Download,
  X,
  House,
  SlidersHorizontal,
  Monitor,
  VolumeX,
  ImagePlus,
  Trash2,
  GripVertical,
  Flag,
  ShieldCheck,
} from "lucide-react";
import {
  defaults,
  emojis,
  type PublicGame,
  type Settings,
  type Property,
  type Score,
} from "@/lib/types";
type Icon = typeof House;
// getRandomValues works on HTTP LAN origins, where randomUUID is unavailable.
function commandId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join(
    "",
  );
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
async function api(url: string, body?: unknown) {
  const res = await fetch("/api/" + url, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed. Please retry.");
  return data;
}
function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">ρ</span>
      <span>
        RHO EPSILON IOTA<small>THE PRICE IS RIGHT</small>
      </span>
    </Link>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="tag">
      <span className="live-dot" />
      {children}
    </span>
  );
}
function ErrorText({ message }: { message: string }) {
  return message ? (
    <div className="error" role="alert">
      {message}
    </div>
  ) : null;
}
function HouseArt({ className = "" }: { className?: string }) {
  return (
    <div className={"house-art " + className}>
      <svg viewBox="0 0 800 560" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="sky"
            x1="0"
            y1="0"
            x2="800"
            y2="560"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#394c42" />
            <stop offset="1" stopColor="#141e1b" />
          </linearGradient>
          <linearGradient
            id="wall"
            x1="250"
            y1="160"
            x2="600"
            y2="450"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d2c8ad" />
            <stop offset="1" stopColor="#827e68" />
          </linearGradient>
        </defs>
        <path fill="url(#sky)" d="M0 0h800v560H0z" />
        <circle cx="620" cy="130" r="72" fill="#d2be88" opacity=".65" />
        <path d="M0 420 160 350 350 409 550 325 800 393v167H0" fill="#263b2c" />
        <path d="m165 254 230-101 232 104-233 99z" fill="#202a25" />
        <path d="m185 268 210 94v150l-210-95z" fill="#787a64" />
        <path d="m395 362 210-94v150l-210 94z" fill="url(#wall)" />
        <path d="m363 226 139-62 143 65-140 65z" fill="#17231c" />
        <path d="m376 238 128 58v139l-128-57z" fill="#9c9e83" />
        <path d="m504 296 128-58v139l-128 58z" fill="#b8b69b" />
        <path d="m418 302 53 24v81l-53-24z" fill="#273b32" />
        <path d="m524 309 75-34v75l-75 33z" fill="#d3b778" />
        <path d="m215 305 113 51v71l-113-51z" fill="#d6b877" />
        <path
          d="m251 322 1 71m38-54v71m270-117v74"
          stroke="#53604e"
          strokeWidth="5"
        />
        <path d="m411 469 101 45-34 16-104-45z" fill="#9d9d82" />
        <path d="m350 500 123 55" stroke="#a7a58e" strokeWidth="8" />
        <path
          d="M85 450V224m-46 94 46-115 51 112-51-27zM690 448V287m-41 58 41-91 46 90-46-18z"
          fill="#233b2a"
          stroke="#233b2a"
          strokeWidth="12"
        />
        <path d="m0 506 168-69 209 96" stroke="#46604a" strokeWidth="2" />
      </svg>
      <span className="art-label">AN EYE FOR REAL ESTATE.</span>
    </div>
  );
}
function Landing() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <div className="landing">
      <header className="site-header">
        <Brand />
        <nav>
          <a href="#how">How to play</a>
          <Link href="/host" className="host-link">
            Host a game <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <Tag>THE RHO EPSILON IOTA GAME NIGHT</Tag>
            <h1>
              Good eye.
              <br />
              Better <em>guess.</em>
            </h1>
            <p>
              From Happy Valley homes to a private island.
              <br />
              Think you know what it’s worth? Prove it.
            </p>
            <div className="hero-actions">
              <Link href="/join" className="button primary">
                Join the game <ArrowUpRight size={19} />
              </Link>
              <Link href="/host" className="button secondary">
                Take the host seat <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <span className="live-dot" /> Live multiplayer
              </span>
              <span>No account needed</span>
              <span>Your phone is your buzzer</span>
            </div>
          </div>
          <div className="hero-visual">
            <HouseArt />
            <div className="visual-top">
              <span>THE PRICE IS RIGHT</span>
              <span>VOL. 01 / FALL ’26</span>
            </div>
            <div className="property-ticket">
              <span className="ticket-icon">
                <House size={25} />
              </span>
              <div>
                <small>YOUR NEXT BIG GUESS</small>
                <strong>
                  Somewhere between
                  <br />
                  “a steal” and “no way.”
                </strong>
              </div>
              <ArrowUpRight size={25} />
            </div>
            <div className="visual-bottom">
              <MapPin size={14} /> STATE COLLEGE → THE BAHAMAS
              <span>10 PROPERTIES</span>
            </div>
          </div>
        </section>
        <section className="join-strip">
          <div>
            <span className="mini-label">ALREADY GOT AN INVITE?</span>
            <h2>Your seat is waiting.</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/play/" + code);
            }}
          >
            <label className="sr-only" htmlFor="quick-code">
              Six-digit room code
            </label>
            <input
              id="quick-code"
              placeholder="Enter room code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <button className="button primary">
              Let’s go <ArrowRight size={18} />
            </button>
          </form>
        </section>
        <section className="how-section" id="how">
          <div className="section-heading">
            <span className="eyebrow">
              A LITTLE INSTINCT. A LITTLE COMPETITION.
            </span>
            <h2>
              The market is a game.
              <br />
              This one has a leaderboard.
            </h2>
          </div>
          <div className="how-grid">
            {[
              {
                n: "01",
                icon: Users,
                title: "Find your people.",
                text: "Scan the QR, pick a name and an emoji, and get in the room.",
              },
              {
                n: "02",
                icon: House,
                title: "Trust your gut.",
                text: "Explore the property, check the details, and lock in your price.",
              },
              {
                n: "03",
                icon: Trophy,
                title: "Climb the board.",
                text: "The closer you get, the more you score. Every round is a fresh shot.",
              },
            ].map((s) => (
              <article key={s.n}>
                <div className="how-top">
                  <s.icon size={24} />
                  <span>{s.n}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="finale-banner">
          <span className="eyebrow">THE GRAND FINALE</span>
          <h2>
            Yes, that last one
            <br />
            is a private island.
          </h2>
          <p>14 acres. Three beaches. One very big guess.</p>
          <span className="outline-tag">EXUMAS, BAHAMAS · DOUBLE POINTS</span>
        </section>
      </main>
      <footer>
        <Brand />
        <span>REAL ESTATE. REAL COMPETITION. REAL GOOD COMPANY.</span>
        <span>PENN STATE · EST. RHO</span>
      </footer>
    </div>
  );
}
function Join() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <div className="join-page">
      <header className="site-header">
        <Brand />
        <Link href="/host">
          Hosting? <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="join-layout">
        <div className="join-card">
          <span className="eyebrow">YOU’RE IN GOOD COMPANY</span>
          <h1>Come on in.</h1>
          <p>
            Enter the room code on the big screen.
            <br />
            Your next great guess starts here.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/play/" + code);
            }}
          >
            <label htmlFor="room-code">ROOM CODE</label>
            <input
              autoFocus
              id="room-code"
              className="code-input"
              placeholder="000 000"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <button className="button primary full">
              Enter the room <ArrowRight size={18} />
            </button>
          </form>
          <small>
            <LockKeyhole size={13} /> No account. Just a name and a little
            intuition.
          </small>
        </div>
        <div className="join-art">
          <HouseArt />
          <div className="join-quote">
            Location, location,
            <br />
            <em>valuation.</em>
          </div>
        </div>
      </div>
    </div>
  );
}
function HostLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("login", { password });
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="center-page">
      <Brand />
      <div className="login-card">
        <span className="icon-box">
          <LockKeyhole />
        </span>
        <span className="eyebrow">THE HOST SEAT</span>
        <h1>You run the show.</h1>
        <p>
          Sign in to set the room, control the rounds,
          <br />
          and keep the competition friendly.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="password">HOST PASSWORD</label>
          <input
            autoFocus
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your host password"
          />
          <ErrorText message={error} />
          <button disabled={busy} className="button primary full">
            {busy ? "Signing in…" : "Enter host dashboard"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
      <Link href="/join" className="muted">
        Here to play? Join a game →
      </Link>
    </div>
  );
}
function Sidebar({ active }: { active: string }) {
  return (
    <aside className="sidebar">
      <Brand />
      <span className="sidebar-label">HOST WORKSPACE</span>
      <nav>
        {[
          {
            href: "/host",
            icon: LayoutGrid,
            label: "Overview",
            key: "overview",
          },
          {
            href: "/admin/properties",
            icon: House,
            label: "Property collection",
            key: "properties",
          },
          {
            href: "/admin/settings",
            icon: SlidersHorizontal,
            label: "Game settings",
            key: "settings",
          },
        ].map((x) => (
          <Link
            href={x.href}
            key={x.key}
            className={active === x.key ? "active" : ""}
          >
            <x.icon size={18} />
            {x.label}
            {active === x.key && <span className="nav-dot" />}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="chapter-badge">ΡΕΙ</span>
        <strong>Rho Epsilon Iota</strong>
        <small>Penn State · Host access</small>
        <button
          onClick={async () => {
            await api("logout", {});
            location.reload();
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
function Workspace({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("status")
      .then((s) => setAuth(s.host))
      .catch((e) => setError(e.message));
  }, []);
  if (error)
    return (
      <div className="center-page">
        <ErrorText message={error} />
        <button className="button secondary" onClick={() => location.reload()}>
          Retry
        </button>
      </div>
    );
  if (auth === null)
    return (
      <div className="center-page">
        <Brand />
        <p>Opening the host workspace…</p>
      </div>
    );
  if (!auth) return <HostLogin onLogin={() => setAuth(true)} />;
  return (
    <div className="workspace">
      <Sidebar active={active} />
      <main className="workspace-main">
        <div className="workspace-top">
          <span>
            RHO EPSILON IOTA <span className="slash">/</span> HOST WORKSPACE
          </span>
          <Tag>HOST ACCESS</Tag>
        </div>
        {children}
      </main>
    </div>
  );
}
function SettingsFields({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (s: Settings) => void;
}) {
  const change = (key: keyof Settings, v: unknown) =>
    onChange({ ...value, [key]: v });
  return (
    <>
      <div className="fields-grid">
        <NumberField
          label="Seconds per round"
          value={value.roundSeconds}
          min={10}
          max={300}
          onChange={(v) => change("roundSeconds", v)}
        />
        <NumberField
          label="Session length · minutes"
          value={value.sessionMinutes}
          min={5}
          max={180}
          onChange={(v) => change("sessionMinutes", v)}
        />
        <NumberField
          label="Number of properties"
          value={value.roundCount}
          min={1}
          max={50}
          onChange={(v) => change("roundCount", v)}
        />
        <NumberField
          label="Final round multiplier"
          value={value.finalMultiplier}
          min={1}
          max={5}
          onChange={(v) => change("finalMultiplier", v)}
        />
        <NumberField
          label="Exact guess bonus"
          value={value.exactBonus}
          min={0}
          max={100}
          onChange={(v) => change("exactBonus", v)}
        />
      </div>
      <div className="settings-toggles">
        {[
          {
            key: "filterNames",
            title: "Keep names friendly",
            text: "Filter common profanity. You can rename or remove players anytime.",
          },
          {
            key: "teamMode",
            title: "Play as teams",
            text: "The first player to join each team becomes its captain and submits guesses.",
          },
          {
            key: "closestUnder",
            title: "Closest without going over",
            text: "Guesses above the asking price earn zero accuracy points.",
          },
          {
            key: "challenge",
            title: "Appraiser’s challenge",
            text: "Players can explain their guess. Award bonus points from the host panel.",
          },
          {
            key: "wagerEnabled",
            title: "Double or nothing",
            text: "Players can risk existing points on their accuracy.",
          },
        ].map((t) => (
          <label className="toggle-row" key={t.key}>
            <span>
              <strong>{t.title}</strong>
              <small>{t.text}</small>
            </span>
            <input
              type="checkbox"
              checked={Boolean(value[t.key as keyof Settings])}
              onChange={(e) =>
                change(t.key as keyof Settings, e.target.checked)
              }
            />
          </label>
        ))}
      </div>
      {value.wagerEnabled && (
        <div className="fields-grid">
          <NumberField
            label="Points to risk"
            value={value.wagerPoints}
            min={1}
            max={50}
            onChange={(v) => change("wagerPoints", v)}
          />
          <NumberField
            label="Accuracy threshold · % error"
            value={value.wagerThreshold}
            min={0}
            max={100}
            onChange={(v) => change("wagerThreshold", v)}
          />
        </div>
      )}
      <div className="scoring-settings">
        <h3>The closer, the better.</h3>
        <p className="muted">
          Percentage error makes a starter home and a private island a fair
          match.
        </p>
        <div className="scoring-grid">
          {value.thresholds.map((t, i) => (
            <div key={i}>
              <NumberField
                label="Within · %"
                value={t}
                min={0}
                max={100}
                onChange={(v) =>
                  change(
                    "thresholds",
                    value.thresholds.map((x, j) => (i === j ? v : x)),
                  )
                }
              />
              <NumberField
                label="Points"
                value={value.points[i]}
                min={0}
                max={100}
                onChange={(v) =>
                  change(
                    "points",
                    value.points.map((x, j) => (i === j ? v : x)),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        required
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function useSavedSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => {
    try {
      const s = localStorage.getItem("rho-settings");
      if (s) setSettings({ ...defaults, ...JSON.parse(s) });
    } catch {}
  }, []);
  return [settings, setSettings] as const;
}
function HostHome() {
  const [settings, setSettings] = useSavedSettings();
  const [title, setTitle] = useState("The Rho Open House");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);
  const router = useRouter();
  useEffect(() => {
    try {
      setRooms(JSON.parse(localStorage.getItem("rho-rooms") ?? "[]"));
    } catch {}
  }, []);
  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { code } = await api("games", { title, settings });
      localStorage.setItem(
        "rho-rooms",
        JSON.stringify([code, ...rooms].slice(0, 20)),
      );
      router.push("/host/" + code);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Let’s get a room going.</h1>
          <p>
            Your properties. Their best guesses. One unforgettable game night.
          </p>
        </div>
        <span className="date-label">
          THE HOST EDITION <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="dashboard-stats">
        <Stat
          icon={House}
          label="THE COLLECTION"
          value="10 properties"
          detail="Happy Valley to the Bahamas"
        />
        <Stat
          icon={Users}
          label="ROOM FOR EVERYONE"
          value="Up to 100 players"
          detail="Individual or team play"
        />
        <Stat
          icon={Clock3}
          label="YOUR PACE"
          value={`${settings.sessionMinutes} minutes`}
          detail={`${settings.roundSeconds} seconds per guess`}
        />
      </div>
      <div className="host-home-grid">
        <form className="panel create-panel" onSubmit={create}>
          <div className="panel-heading">
            <span className="icon-box">
              <Plus size={21} />
            </span>
            <div>
              <h2>New game, fresh guesses.</h2>
              <p>Set the vibe. We’ll handle the room code.</p>
            </div>
          </div>
          <label className="field">
            <span>Game name</span>
            <input
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="fields-grid">
            <NumberField
              label="Round timer · seconds"
              value={settings.roundSeconds}
              min={10}
              max={300}
              onChange={(v) => setSettings({ ...settings, roundSeconds: v })}
            />
            <NumberField
              label="Session · minutes"
              value={settings.sessionMinutes}
              min={5}
              max={180}
              onChange={(v) => setSettings({ ...settings, sessionMinutes: v })}
            />
          </div>
          <Link href="/admin/settings" className="text-link">
            Fine-tune game settings <Settings2 size={15} />
          </Link>
          <ErrorText message={error} />
          <button disabled={busy} className="button primary full">
            {busy ? "Setting the stage…" : "Create game room"}{" "}
            <ArrowUpRight size={18} />
          </button>
          <span className="form-note">
            <ShieldCheck size={14} /> A private answer key. A public good time.
          </span>
        </form>
        <div className="host-guide">
          <span className="eyebrow">HOST’S FIELD NOTES</span>
          <h2>
            A great game starts
            <br />
            with a good host.
          </h2>
          {[
            "Create a room and put the QR code on the big screen.",
            "Give everyone a minute to choose their name and character.",
            "Open each round, reveal the price, then celebrate the leaderboard.",
          ].map((s, i) => (
            <div className="guide-step" key={s}>
              <span>0{i + 1}</span>
              <p>{s}</p>
            </div>
          ))}
          <Link href="/admin/properties">
            Explore the property collection <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      {rooms.length > 0 && (
        <section className="recent-rooms">
          <h2>Your recent rooms</h2>
          <div className="room-links">
            {rooms.map((c) => (
              <Link className="panel room-link" href={"/host/" + c} key={c}>
                <span>
                  ROOM <strong>{c}</strong>
                </span>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: Icon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <span>
        <Icon size={18} />
        {label}
      </span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function SettingsPage() {
  const [settings, setSettings] = useSavedSettings();
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SET THE HOUSE RULES</span>
          <h1>Your game. Your pace.</h1>
          <p>
            Defaults for new rooms on this browser. Active games keep their
            original settings.
          </p>
        </div>
      </div>
      <form
        className="panel settings-panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !settings.thresholds.every(
              (v, i) => i === 0 || v > settings.thresholds[i - 1],
            )
          )
            return;
          localStorage.setItem("rho-settings", JSON.stringify(settings));
          setSaved(true);
        }}
      >
        <SettingsFields
          value={settings}
          onChange={(s) => {
            setSettings(s);
            setSaved(false);
          }}
        />
        {!settings.thresholds.every(
          (v, i) => i === 0 || v > settings.thresholds[i - 1],
        ) && (
          <ErrorText message="Scoring thresholds must increase from left to right." />
        )}
        <div className="save-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSettings(defaults);
              setSaved(false);
            }}
          >
            Reset defaults
          </button>
          <button className="button primary">
            {saved ? (
              <>
                <Check size={17} /> Settings saved
              </>
            ) : (
              <>
                Save settings <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
function useGame(code: string, privileged = false) {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const pending = useRef(false);
  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      const g = await api("games/" + code + (privileged ? "?host=1" : ""));
      setGame(g);
      setError("");
      setConnected(true);
    } catch (e) {
      setError((e as Error).message);
      setConnected(false);
    } finally {
      pending.current = false;
    }
  }, [code, privileged]);
  useEffect(() => {
    load();
    const hasRealtime = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const timer = setInterval(load, hasRealtime ? 8000 : 2000);
    const focus = () => load();
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    let cleanup = () => {};
    if (hasRealtime) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const ch = client
        .channel("room-" + code)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_updates",
            filter: "code=eq." + code,
          },
          () => load(),
        )
        .subscribe();
      cleanup = () => {
        client.removeChannel(ch);
      };
    }
    return () => {
      clearInterval(timer);
      cleanup();
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [code, load]);
  return { game, error, connected, reload: load, setGame };
}
function Timer({ game }: { game: PublicGame }) {
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(game.serverNow - Date.now());
    setNow(Date.now());
  }, [game.serverNow]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  const seconds =
    game.paused !== null
      ? Math.ceil(game.paused / 1000)
      : game.deadline
        ? Math.max(0, Math.ceil((game.deadline - now - offset) / 1000))
        : 0;
  return (
    <div
      className={
        "timer " + (seconds <= 10 && game.phase === "guessing" ? "urgent" : "")
      }
    >
      <Clock3 size={18} />
      <strong>
        {game.phase === "guessing"
          ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
          : game.phase === "locked"
            ? "LOCKED"
            : "READY"}
      </strong>
      {game.paused !== null && <small>PAUSED</small>}
    </div>
  );
}
function Gallery({
  property,
  large = false,
}: {
  property: PublicGame["property"];
  large?: boolean;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [property.id]);
  const images = property.images;
  return (
    <div className={"gallery " + (large ? "large" : "")}>
      {images.length ? (
        <img
          key={images[index]}
          src={images[index] ?? images[0]}
          alt={`${property.address} — property photo ${index + 1}`}
        />
      ) : (
        <>
          <HouseArt />
          <div className="placeholder-note">
            <ImagePlus size={17} />
            <span>
              Property photos pending
              <small>Upload listing photos in the property collection.</small>
            </span>
          </div>
        </>
      )}
      <div className="gallery-top">
        <span className="image-chip">{property.category}</span>
        {images.length > 0 && (
          <span className="image-chip">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <>
          <button
            aria-label="Previous photo"
            className="gallery-prev"
            onClick={() =>
              setIndex((index + images.length - 1) % images.length)
            }
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next photo"
            className="gallery-next"
            onClick={() => setIndex((index + 1) % images.length)}
          >
            <ChevronRight />
          </button>
          <div className="gallery-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={index === i ? "active" : ""}
                aria-label={`View photo ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function PropertyInfo({ property }: { property: PublicGame["property"] }) {
  return (
    <div className="property-info">
      <span className="eyebrow">
        <MapPin size={13} />
        {property.city}
      </span>
      <h2>{property.address}</h2>
      <span className="property-type">{property.type}</span>
      <div className="property-facts">
        <span>
          <BedDouble size={19} />
          <strong>{property.beds ?? "—"}</strong> beds
        </span>
        <span>
          <Bath size={19} />
          <strong>{property.baths ?? "—"}</strong> baths
        </span>
        <span>
          <Maximize size={18} />
          <strong>
            {property.sqft?.toLocaleString() ??
              (property.acres ? property.acres : "—")}
          </strong>{" "}
          {property.sqft ? "sq ft" : property.acres ? "acres" : "sq ft"}
        </span>
      </div>
      {(property.beds === null || property.baths === null) && (
        <small className="muted">
          Unlisted property details are shown as —.
        </small>
      )}
      <div className="property-notes">
        {property.facts.map((f) => (
          <span key={f}>
            <Check size={13} />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
function Leaderboard({
  rows,
  me,
  round = false,
  final = false,
}: {
  rows: Score[];
  me?: string;
  round?: boolean;
  final?: boolean;
}) {
  return (
    <section className={"leaderboard " + (final ? "final-board" : "")}>
      <div className="board-heading">
        <div>
          <span className="eyebrow">
            {final ? "THE FINAL WORD" : round ? "THIS ROUND" : "THE STANDINGS"}
          </span>
          <h2>
            {final
              ? "A very good eye."
              : round
                ? "Closest to the keys."
                : "A little friendly competition."}
          </h2>
        </div>
        <Trophy size={25} />
      </div>
      {final && rows.length > 0 && (
        <div className="podium">
          {[rows[1], rows[0], rows[2]].filter(Boolean).map((p) => (
            <div key={p.id} className={"podium-place place-" + p.rank}>
              <span>{p.emoji}</span>
              <strong>{p.name}</strong>
              <small>{p.points} PTS</small>
              <div>{p.rank === 1 ? "♛" : p.rank}</div>
            </div>
          ))}
        </div>
      )}
      <div className="board-labels">
        <span>RANK / PLAYER</span>
        <span>{round ? "GUESS / ERROR" : "ACCURACY"}</span>
        <span>POINTS</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">
          <Trophy size={28} />
          <p>The board is yours to fill.</p>
          <small>Players will appear as they join.</small>
        </div>
      ) : (
        rows.map((p, i) => (
          <div
            key={p.id}
            className={"score-row " + (p.id === me ? "is-me" : "")}
          >
            <span className={"rank rank-" + (i + 1)}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="player-emoji">{p.emoji}</span>
            <div className="player-name">
              <strong>
                {p.name}
                {p.id === me && <small> YOU</small>}
              </strong>
              <small>
                {p.team || "Independent appraiser"}
                {p.streak >= 2 ? ` · 🔥 ${p.streak} streak` : ""}
              </small>
            </div>
            <span className="score-error">
              {round ? (
                p.guess !== null ? (
                  <>
                    {money(p.guess)}
                    <small>{p.percentage?.toFixed(1)}% off</small>
                  </>
                ) : (
                  "No guess"
                )
              ) : Number.isFinite(p.error) ? (
                `${p.error.toFixed(1)}% avg.`
              ) : (
                "—"
              )}
            </span>
            <strong className="points">
              {round ? `+${p.roundPoints}` : p.points}
              <small>PTS</small>
            </strong>
          </div>
        ))
      )}
    </section>
  );
}
function Lobby({ game, host = false }: { game: PublicGame; host?: boolean }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(location.origin + "/play/" + game.code);
  }, [game.code]);
  return (
    <div className="lobby">
      <div className="lobby-invite">
        <span className="eyebrow">THE DOOR IS OPEN</span>
        <h1>
          A room full
          <br />
          of possibilities.
        </h1>
        <p>
          Scan. Join. Trust your gut.
          <br />
          We’ll take care of the rest.
        </p>
        <div className="room-code-box">
          <span>YOUR ROOM CODE</span>
          <strong>
            {game.code.slice(0, 3)} {game.code.slice(3)}
          </strong>
          <button
            aria-label="Copy invite link"
            onClick={() => {
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        </div>
        {url && (
          <div className="qr-wrap">
            <QRCodeSVG
              value={url}
              size={130}
              bgColor="#f8f5ed"
              fgColor="#1c241e"
              level="M"
            />
            <span>
              POINT YOUR CAMERA HERE
              <small>Or visit {url.replace(/^https?:\/\//, "")}</small>
            </span>
          </div>
        )}
        <div className="lobby-rules">
          <span>
            <Clock3 size={15} />
            {game.settings.roundSeconds}s per guess
          </span>
          <span>
            <House size={15} />
            {game.total} properties
          </span>
          <span>
            <Trophy size={15} />
            {game.settings.finalMultiplier}× final round
          </span>
        </div>
        {game.settings.closestUnder && (
          <p className="rule-note">
            Closest without going over: overbids earn zero accuracy points.
          </p>
        )}
        {game.settings.wagerEnabled && (
          <p className="rule-note">
            Wager {game.settings.wagerPoints} points: within{" "}
            {game.settings.wagerThreshold}% error wins the wager; otherwise
            those points are lost.
          </p>
        )}
      </div>
      <div className="lobby-players panel">
        <div className="panel-heading">
          <h2>Look who’s home.</h2>
          <span className="count-chip">
            {game.players.filter((p) => !p.banned).length} PLAYERS
          </span>
        </div>
        <div className="player-grid">
          {game.players
            .filter((p) => !p.banned)
            .map((p) => (
              <div key={p.id} className="player-card">
                <span>{p.emoji}</span>
                <strong>{p.name}</strong>
                {p.team && (
                  <small>
                    {p.team}
                    {p.captain ? " · Captain" : ""}
                  </small>
                )}
              </div>
            ))}
          {!game.players.length && (
            <div className="empty-state">
              <Users size={32} />
              <p>Good company is on the way.</p>
              <small>Share the code to fill the room.</small>
            </div>
          )}
        </div>
        <div className="waiting-note">
          <span className="live-dot" />
          {host
            ? "Your stage. Start whenever you’re ready."
            : "You’re in. The host will start the show."}
        </div>
      </div>
    </div>
  );
}
function PlayerJoin({
  game,
  onJoined,
}: {
  game: PublicGame;
  onJoined: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojis[0]);
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function join(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("games/" + game.code + "/join", { name, emoji, team });
      onJoined();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="center-page player-join">
      <Brand />
      <form className="panel identity-form" onSubmit={join}>
        <span className="eyebrow">ROOM {game.code}</span>
        <h1>Make an entrance.</h1>
        <p>Pick your name. Find your character.</p>
        <label className="field">
          <span>Your display name</span>
          <input
            autoFocus
            minLength={2}
            maxLength={24}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Future homeowner"
            autoComplete="nickname"
          />
        </label>
        <label>YOUR CHARACTER</label>
        <div className="emoji-picker">
          {emojis.map((x) => (
            <button
              aria-label={`Choose ${x}`}
              aria-pressed={emoji === x}
              className={emoji === x ? "selected" : ""}
              type="button"
              key={x}
              onClick={() => setEmoji(x)}
            >
              {x}
            </button>
          ))}
        </div>
        {game.settings.teamMode && (
          <label className="field">
            <span>Team name · first to join is captain</span>
            <input
              minLength={2}
              maxLength={24}
              required
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Enter an existing team or create one"
            />
          </label>
        )}
        <ErrorText message={error} />
        <button
          disabled={busy || game.phase !== "lobby"}
          className="button primary full"
        >
          {busy
            ? "Joining…"
            : game.phase !== "lobby"
              ? "Game already underway"
              : "I’m in"}{" "}
          <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}
function GuessForm({ game, reload }: { game: PublicGame; reload: () => void }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [wager, setWager] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(game.serverNow - Date.now());
  }, [game.serverNow]);
  useEffect(() => {
    setAmount(game.me?.guess?.amount ? String(game.me.guess.amount) : "");
    setReason("");
    setWager(false);
    setError("");
  }, [game.index, game.me?.guess?.amount]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const player = game.players.find((p) => p.id === game.me?.id);
  const expired = game.deadline !== null && now + offset >= game.deadline;
  const open =
    game.phase === "guessing" &&
    game.paused === null &&
    !expired &&
    (!game.settings.teamMode || player?.captain);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("games/" + game.code + "/guess", {
        amount: Number(amount),
        reason,
        wager,
        key: commandId(),
      });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="guess-form panel" onSubmit={submit}>
      <span className="eyebrow">YOUR INSTINCT. YOUR NUMBER.</span>
      <h2>What’s the asking price?</h2>
      {game.settings.teamMode && !player?.captain ? (
        <p className="muted">
          Discuss with your team. Your captain submits the official guess.
        </p>
      ) : (
        <>
          <label className="sr-only" htmlFor="guess">
            Your dollar estimate
          </label>
          <div className="currency-input">
            <span>$</span>
            <input
              id="guess"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Your best guess"
              value={amount ? Number(amount).toLocaleString("en-US") : ""}
              onChange={(e) =>
                setAmount(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              required
              disabled={!open}
            />
          </div>
          {game.settings.challenge && (
            <label className="field">
              <span>Make your case · optional</span>
              <textarea
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
                disabled={!open}
                placeholder="What makes you think so?"
              />
            </label>
          )}
          {game.settings.wagerEnabled && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={wager}
                onChange={(e) => setWager(e.target.checked)}
                disabled={!open}
              />{" "}
              Risk {game.settings.wagerPoints} points · win within{" "}
              {game.settings.wagerThreshold}% error
            </label>
          )}
          <ErrorText message={error} />
          <button disabled={!open || busy} className="button primary full">
            {busy
              ? "Locking it in…"
              : game.me?.guess
                ? "Update my guess"
                : "Submit my guess"}
            {game.me?.guess ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
          {game.me?.guess && (
            <div className="submission-confirmation">
              <Check size={15} /> {money(game.me.guess.amount)} submitted.{" "}
              {open ? "You can edit until time runs out." : ""}
            </div>
          )}
        </>
      )}
      {!open && (
        <p className="form-note">
          <LockKeyhole size={14} />
          {game.paused !== null
            ? "The host paused the clock."
            : game.phase === "intro"
              ? "Take a look. Guessing opens in a moment."
              : "Guesses are locked. The reveal is coming."}
        </p>
      )}
    </form>
  );
}
function Reveal({ game }: { game: PublicGame }) {
  const me = game.leaderboard.find((p) => p.id === game.me?.id);
  return (
    <div className="reveal-section">
      <div className="answer-card">
        <span className="eyebrow">THE ASKING PRICE</span>
        <h1 key={game.index}>{money(game.property.price ?? 0)}</h1>
        <span>
          {game.property.address} · {game.property.city}
        </span>
        {me && (
          <div className="personal-result">
            <span>
              Your guess
              <strong>
                {me.guess !== null ? money(me.guess) : "No guess"}
              </strong>
            </span>
            <span>
              Off by<strong>{me.percentage?.toFixed(1) ?? "—"}%</strong>
            </span>
            <span>
              This round<strong>+{me.roundPoints} points</strong>
            </span>
          </div>
        )}
        {game.property.source && (
          <a
            href={game.property.source}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            View the reference listing <ArrowUpRight size={15} />
          </a>
        )}
      </div>
      <Leaderboard rows={game.roundLeaderboard} round me={game.me?.id} />
      <Leaderboard rows={game.leaderboard} me={game.me?.id} />
    </div>
  );
}
function PlayerScreen({
  code,
  display = false,
  results = false,
}: {
  code: string;
  display?: boolean;
  results?: boolean;
}) {
  const { game, error, connected, reload } = useGame(code);
  if (!game)
    return (
      <div className="center-page">
        <Brand />
        {error ? (
          <>
            <ErrorText message={error} />
            <button className="button secondary" onClick={reload}>
              Try again
            </button>
            <Link href="/join">Try another room</Link>
          </>
        ) : (
          <p>Finding your room…</p>
        )}
      </div>
    );
  if (!display && !results && !game.me)
    return <PlayerJoin game={game} onJoined={reload} />;
  return (
    <div className={"game-screen " + (display ? "presentation" : "")}>
      <header className="game-header">
        <Brand />
        <div className="game-header-right">
          <span className="connection">
            <span className={connected ? "live-dot" : "offline-dot"} />
            {connected ? "LIVE" : "RECONNECTING"}
          </span>
          <span className="room-mini">
            ROOM <strong>{game.code}</strong>
          </span>
          {display && (
            <button
              className="icon-button"
              aria-label="Toggle fullscreen"
              onClick={() =>
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : document.documentElement.requestFullscreen()
              }
            >
              <Maximize size={19} />
            </button>
          )}
        </div>
      </header>
      <ErrorText message={error} />
      <main className="game-main">
        {game.phase === "lobby" ? (
          <Lobby game={game} />
        ) : game.phase === "finished" ? (
          <Leaderboard rows={game.leaderboard} me={game.me?.id} final />
        ) : game.phase === "leaderboard" ? (
          <>
            <div className="round-over">
              <span className="eyebrow">
                ROUND {String(game.index + 1).padStart(2, "0")} COMPLETE
              </span>
              <h1>Every guess counts.</h1>
              <p>The next property is just around the corner.</p>
            </div>
            <Leaderboard rows={game.leaderboard} me={game.me?.id} />
          </>
        ) : game.phase === "reveal" ? (
          <Reveal game={game} />
        ) : (
          <>
            <div className="round-header">
              <div>
                <span className="eyebrow">
                  {game.index === game.total - 1
                    ? "THE GRAND FINALE"
                    : "THE NEXT OPEN HOUSE"}
                </span>
                <h1>
                  Round {String(game.index + 1).padStart(2, "0")}{" "}
                  <span>/ {String(game.total).padStart(2, "0")}</span>
                </h1>
              </div>
              <Timer game={game} />
            </div>
            <div className="play-layout">
              <div>
                <Gallery property={game.property} large />
                <PropertyInfo property={game.property} />
              </div>
              {display ? (
                <div className="display-progress panel">
                  <span className="eyebrow">TRUST YOUR GUT</span>
                  <h2>What’s it worth?</h2>
                  <strong>
                    {game.submitted}
                    <small>
                      {" "}
                      /{" "}
                      {
                        game.players.filter(
                          (p) =>
                            !p.banned && (!game.settings.teamMode || p.captain),
                        ).length
                      }
                    </small>
                  </strong>
                  <span>GUESSES ARE IN</span>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${(game.submitted / Math.max(1, game.players.filter((p) => !p.banned && (!game.settings.teamMode || p.captain)).length)) * 100}%`,
                      }}
                    />
                  </div>
                  <p>
                    {game.phase === "intro"
                      ? "Get a good look. The clock starts soon."
                      : game.phase === "locked"
                        ? "Time’s up. Let’s see who has the eye."
                        : "Submit your estimate on your phone."}
                  </p>
                </div>
              ) : (
                <GuessForm key={game.index} game={game} reload={reload} />
              )}
            </div>
          </>
        )}
        <div className="game-footer">
          <span>RHO EPSILON IOTA · THE PRICE IS RIGHT</span>
          <span>
            {game.phase === "finished"
              ? "THAT’S A WRAP."
              : display
                ? "YOUR PHONE IS YOUR BUZZER."
                : "THE CLOSER, THE BETTER."}
          </span>
        </div>
      </main>
    </div>
  );
}
function HostGame({ code }: { code: string }) {
  const { game, error, connected, reload, setGame } = useGame(code, true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [moderate, setModerate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏡");
  const [bonus, setBonus] = useState(5);
  async function control(action: string, extra: Record<string, unknown> = {}) {
    if (!game) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await api("games/" + code + "/control", {
        action,
        key: commandId(),
        revision: game.controlRevision,
        ...extra,
      });
      setGame(updated);
      setConfirm(null);
      setModerate(null);
    } catch (e) {
      setActionError((e as Error).message);
      reload();
    } finally {
      setBusy(false);
    }
  }
  if (!game)
    return (
      <div className="center-page">
        <ErrorText message={error} />
        {!error && <p>Opening your room…</p>}
        <button className="button secondary" onClick={reload}>
          Retry
        </button>
      </div>
    );
  if (!game.isHost)
    return (
      <div className="center-page">
        <h1>This is another host’s room.</h1>
        <Link href="/host">Back to your dashboard</Link>
      </div>
    );
  const p = game.players.find((p) => p.id === moderate);
  const primary: Record<string, { label: string; action: string; icon: Icon }> =
    {
      lobby: { label: "Start the game", action: "start", icon: Play },
      intro: { label: "Open guessing", action: "open", icon: Play },
      guessing: { label: "Lock guesses", action: "lock", icon: LockKeyhole },
      locked: { label: "Reveal the price", action: "reveal", icon: Eye },
      reveal: {
        label: "Show leaderboard",
        action: "leaderboard",
        icon: Trophy,
      },
      leaderboard: {
        label:
          game.index === game.total - 1 ? "Finish the game" : "Next property",
        action: "next",
        icon: ArrowRight,
      },
    };
  const next = primary[game.phase];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOU’RE LIVE · ROOM {game.code}</span>
          <h1>{game.title}</h1>
          <p>
            <span className={connected ? "live-dot" : "offline-dot"} />{" "}
            {connected ? "Everything’s in sync." : "Reconnecting…"} You set the
            pace.
          </p>
        </div>
        <div className="heading-actions">
          <Link
            href={"/display/" + code}
            target="_blank"
            className="button secondary"
          >
            <Monitor size={17} /> Open projector <ArrowUpRight size={15} />
          </Link>
          <a
            href={"/api/games/" + code + "/export"}
            className="icon-button"
            title="Download results"
          >
            <Download size={19} />
          </a>
        </div>
      </div>
      <div className="host-control-bar">
        <div>
          <span className="eyebrow">{game.phase.toUpperCase()}</span>
          <strong>
            {game.phase === "lobby"
              ? "The room is filling up."
              : game.phase === "finished"
                ? "That’s a wrap."
                : `Round ${game.index + 1} of ${game.total}`}
          </strong>
        </div>
        <div className="control-actions">
          {game.phase === "guessing" && (
            <button
              disabled={busy}
              className="button secondary"
              onClick={() => control(game.paused !== null ? "resume" : "pause")}
            >
              {game.paused !== null ? <Play size={17} /> : <Pause size={17} />}{" "}
              {game.paused !== null ? "Resume" : "Pause"}
            </button>
          )}
          {next && (
            <button
              disabled={busy}
              className="button primary"
              onClick={() => control(next.action)}
            >
              {busy ? "One moment…" : next.label}
              <next.icon size={17} />
            </button>
          )}
        </div>
      </div>
      <ErrorText message={actionError || error} />
      {game.phase === "lobby" ? (
        <Lobby game={game} host />
      ) : game.phase === "finished" ? (
        <Leaderboard rows={game.leaderboard} final />
      ) : (
        <div className="host-active-grid">
          <div>
            <div className="host-round-meta">
              <span>
                ROUND {String(game.index + 1).padStart(2, "0")} / {game.total}
              </span>
              <Timer game={game} />
              <span>
                <Users size={15} />
                {game.submitted} guesses in
              </span>
            </div>
            <Gallery property={game.property} />
            <PropertyInfo property={game.property} />
            <div className="host-answer">
              <LockKeyhole size={16} />
              <span>HOST-ONLY ANSWER</span>
              <strong>{money(game.property.price ?? 0)}</strong>
            </div>
          </div>
          <div>
            <Leaderboard
              rows={
                game.phase === "reveal"
                  ? game.roundLeaderboard
                  : game.leaderboard
              }
              round={game.phase === "reveal"}
            />
          </div>
        </div>
      )}
      <section className="panel moderation-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">KEEP IT FRIENDLY</span>
            <h2>The people in your room.</h2>
          </div>
          <span className="count-chip">
            {game.players.filter((p) => !p.banned).length} ACTIVE
          </span>
        </div>
        {game.players.length === 0 ? (
          <p className="muted">Players appear here when they join.</p>
        ) : (
          <div className="moderation-list">
            {game.players.map((p) => (
              <div key={p.id}>
                <span className="player-emoji">{p.emoji}</span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.banned
                      ? "Removed"
                      : p.team
                        ? p.team + (p.captain ? " · Captain" : "")
                        : "Individual player"}
                  </small>
                </span>
                <button
                  disabled={p.banned}
                  className="button tiny secondary"
                  onClick={() => {
                    setModerate(p.id);
                    setName(p.name);
                    setEmoji(p.emoji);
                  }}
                >
                  Manage <Settings2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="danger-controls">
        <span>
          <Settings2 size={16} /> Host controls
        </span>
        {["intro", "guessing", "locked"].includes(game.phase) && (
          <button onClick={() => setConfirm("skip")}>Skip property</button>
        )}
        {!["lobby", "finished"].includes(game.phase) && (
          <button onClick={() => setConfirm("restartRound")}>
            Restart round
          </button>
        )}
        <button onClick={() => setConfirm("restart")}>Restart game</button>
        {game.phase !== "finished" && (
          <button onClick={() => setConfirm("end")}>End game</button>
        )}
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <Flag size={28} />
            <h2 id="confirm-title">
              {
                {
                  restart: "Restart this game?",
                  restartRound: "Restart this round?",
                  skip: "Skip this property?",
                  end: "End the game?",
                }[confirm]
              }
            </h2>
            <p>
              {confirm === "restart"
                ? "All guesses, scores, and bonus points will be cleared. Players stay in the lobby."
                : confirm === "restartRound"
                  ? "This round’s guesses and scores will be cleared."
                  : confirm === "skip"
                    ? "This round’s guesses will be cleared and everyone receives zero points for it."
                    : "The current round will be scored and final rankings will be shown."}
            </p>
            <div className="save-row">
              <button
                className="button secondary"
                onClick={() => setConfirm(null)}
              >
                Keep playing
              </button>
              <button
                disabled={busy}
                className="button primary"
                onClick={() => control(confirm)}
              >
                Confirm <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {p && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-title"
          >
            <button
              aria-label="Close player management"
              className="modal-close icon-button"
              onClick={() => setModerate(null)}
            >
              <X size={18} />
            </button>
            <h2 id="moderation-title">Manage {p.name}</h2>
            <label className="field">
              <span>Display name</span>
              <input
                maxLength={24}
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="emoji-picker">
              {emojis.map((e) => (
                <button
                  aria-label={`Choose ${e}`}
                  aria-pressed={emoji === e}
                  className={emoji === e ? "selected" : ""}
                  onClick={() => setEmoji(e)}
                  key={e}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              className="button primary full"
              disabled={busy}
              onClick={() => control("rename", { playerId: p.id, name, emoji })}
            >
              Save name & character
            </button>
            {game.settings.challenge && (
              <div className="bonus-control">
                <NumberField
                  label="Manual bonus points"
                  min={-100}
                  max={100}
                  value={bonus}
                  onChange={setBonus}
                />
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => control("bonus", { playerId: p.id, bonus })}
                >
                  Award bonus
                </button>
              </div>
            )}
            <button
              className="button danger full"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this player and their guesses from the game?",
                  )
                )
                  control("ban", { playerId: p.id });
              }}
            >
              <VolumeX size={17} /> Remove player
            </button>
            <ErrorText message={actionError} />
          </div>
        </div>
      )}
    </>
  );
}
function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [url, setUrl] = useState("");
  const originalPrices = useRef<Record<string, number>>({});
  const load = useCallback(
    () =>
      api("catalog")
        .then((p: Property[]) => {
          setProperties(p);
          originalPrices.current = Object.fromEntries(
            p.map((x) => [x.id, x.price]),
          );
          setError("");
        })
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const property = properties.find((p) => p.id === selected);
  const edit = (patch: Partial<Property>) => {
    setProperties(
      properties.map((p) => (p.id === selected ? { ...p, ...patch } : p)),
    );
    setSaved(false);
  };
  async function save() {
    if (
      properties.some(
        (p) =>
          originalPrices.current[p.id] !== undefined &&
          originalPrices.current[p.id] !== p.price,
      ) &&
      !window.confirm(
        "Update reference answers for future games? Existing rooms keep their frozen answers.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("catalog", properties);
      originalPrices.current = Object.fromEntries(
        properties.map((p) => [p.id, p.price]),
      );
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !property) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      edit({ images: [...property.images, data.url] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PROPERTY COLLECTION</span>
          <h1>Every home has a number.</h1>
          <p>
            A curated journey from Happy Valley to a private island. Make it
            your own.
          </p>
        </div>
        <button
          disabled={busy || !properties.length}
          onClick={save}
          className="button primary"
        >
          {busy ? "Saving…" : saved ? "Collection saved" : "Save collection"}
          {saved ? <Check size={17} /> : <ArrowRight size={17} />}
        </button>
      </div>
      <div className="collection-note">
        <ShieldCheck size={18} />
        <span>
          Prices are frozen when a room is created. Edits apply to future rooms.
          Upload photos you have permission to use.
        </span>
      </div>
      <ErrorText message={error} />
      {!properties.length && (
        <button className="button secondary" onClick={load}>
          Load collection
        </button>
      )}
      <div className="property-grid">
        {properties.map((p, i) => (
          <button
            key={p.id}
            className="property-card"
            onClick={() => setSelected(p.id)}
          >
            <div className="property-card-image">
              {p.images[0] ? (
                <img src={p.images[0]} alt={p.address} />
              ) : (
                <HouseArt />
              )}
              <span>
                {String(i + 1).padStart(2, "0")} / {p.category}
              </span>
            </div>
            <div className="property-card-info">
              <small>{p.city}</small>
              <h3>{p.address}</h3>
              <div>
                <span>
                  {p.beds ?? "—"} bd · {p.baths ?? "—"} ba ·{" "}
                  {p.sqft?.toLocaleString() ??
                    (p.acres ? `${p.acres} acres` : "—")}
                  {p.sqft ? " sq ft" : ""}
                </span>
                <ArrowUpRight size={17} />
              </div>
              <strong>{money(p.price)}</strong>
              <small>
                {p.images.length
                  ? `${p.images.length} photos`
                  : "Add property photos"}
              </small>
            </div>
          </button>
        ))}
        <button
          className="property-card add-property"
          onClick={() => {
            const id = commandId();
            setProperties([
              ...properties,
              {
                id,
                address: "New property",
                city: "City, State",
                category: "The collection",
                price: 100000,
                beds: null,
                baths: null,
                sqft: null,
                type: "Residential",
                facts: [],
                images: [],
                source: "https://example.com",
              },
            ]);
            setSelected(id);
            setSaved(false);
          }}
        >
          <Plus size={30} />
          <strong>Add a property</strong>
          <small>The next great guess.</small>
        </button>
      </div>
      {property && (
        <div className="modal-backdrop">
          <div
            className="modal property-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-title"
          >
            <button
              className="modal-close icon-button"
              onClick={() => setSelected(null)}
              aria-label="Close property editor"
            >
              <X />
            </button>
            <span className="eyebrow">EDIT THE COLLECTION</span>
            <h2 id="property-title">The details make the difference.</h2>
            <div className="fields-grid">
              {(["address", "city", "category", "type", "source"] as const).map(
                (k) => (
                  <label className="field" key={k}>
                    <span>{k === "source" ? "Listing source URL" : k}</span>
                    <input
                      value={property[k]}
                      onChange={(e) => edit({ [k]: e.target.value })}
                    />
                  </label>
                ),
              )}
              <NumberField
                label="Reference asking price · USD"
                value={property.price}
                min={1}
                max={1e9}
                onChange={(price) => edit({ price })}
              />
              {(["beds", "baths", "sqft", "acres"] as const).map((k) => (
                <label className="field" key={k}>
                  <span>
                    {
                      {
                        beds: "Bedrooms",
                        baths: "Bathrooms",
                        sqft: "Interior · sq ft",
                        acres: "Land · acres",
                      }[k]
                    }
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={k === "baths" || k === "acres" ? "0.5" : "1"}
                    value={property[k] ?? ""}
                    placeholder="Unknown"
                    onChange={(e) =>
                      edit({
                        [k]:
                          e.target.value === ""
                            ? k === "acres"
                              ? undefined
                              : null
                            : Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label className="field">
              <span>Interesting facts · one per line</span>
              <textarea
                value={property.facts.join("\n")}
                onChange={(e) => edit({ facts: e.target.value.split("\n") })}
              />
            </label>
            <div className="editor-heading">
              <h3>Property photographs</h3>
              <label className="button secondary tiny">
                <ImagePlus size={16} /> {busy ? "Uploading…" : "Upload photos"}
                <input
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="muted">
              Exterior, interior, and neighborhood shots. Keep prices and
              listing text out of photos.
            </p>
            <div className="image-editor-list">
              {property.images.map((image, i) => (
                <div key={i}>
                  <img src={image} alt={`Photo ${i + 1}`} />
                  <span>
                    Photo {i + 1}
                    {i === 0 ? " · Cover" : ""}
                  </span>
                  <button
                    className="icon-button"
                    disabled={i === 0}
                    aria-label="Move photo earlier"
                    onClick={() => {
                      const images = [...property.images];
                      [images[i - 1], images[i]] = [images[i], images[i - 1]];
                      edit({ images });
                    }}
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete photo"
                    onClick={() =>
                      edit({
                        images: property.images.filter((_, j) => i !== j),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="url-add">
              <label className="sr-only" htmlFor="photo-url">
                Photo URL
              </label>
              <input
                id="photo-url"
                type="url"
                placeholder="Or paste an authorized HTTPS photo URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="button secondary"
                onClick={() => {
                  if (/^https:\/\//.test(url)) {
                    edit({ images: [...property.images, url] });
                    setUrl("");
                  }
                }}
              >
                Add
              </button>
            </div>
            <div className="save-row">
              <div>
                <button
                  className="button danger"
                  onClick={() => {
                    if (
                      window.confirm("Remove this property from future games?")
                    ) {
                      setProperties(
                        properties.filter((p) => p.id !== selected),
                      );
                      setSelected(null);
                      setSaved(false);
                    }
                  }}
                >
                  Remove
                </button>
                <button
                  className="button secondary"
                  disabled={
                    properties.findIndex((p) => p.id === selected) === 0
                  }
                  onClick={() => {
                    const index = properties.findIndex(
                      (p) => p.id === selected,
                    );
                    const next = [...properties];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    setProperties(next);
                    setSaved(false);
                  }}
                >
                  <GripVertical size={16} /> Move earlier
                </button>
              </div>
              <button
                className="button primary"
                onClick={() => setSelected(null)}
              >
                Done <Check size={16} />
              </button>
            </div>
            <small className="muted">
              Use Save collection to persist your edits.
            </small>
            <ErrorText message={error} />
          </div>
        </div>
      )}
    </>
  );
}
export default function App({ slug }: { slug: string[] }) {
  const [route, code] = slug;
  if (!route) return <Landing />;
  if (route === "join") return <Join />;
  if (route === "host")
    return (
      <Workspace active="overview">
        {code ? <HostGame code={code} /> : <HostHome />}
      </Workspace>
    );
  if (route === "admin")
    return (
      <Workspace active={code === "properties" ? "properties" : "settings"}>
        {code === "properties" ? <PropertiesPage /> : <SettingsPage />}
      </Workspace>
    );
  if (["play", "display", "results"].includes(route) && code)
    return (
      <PlayerScreen
        code={code}
        display={route === "display"}
        results={route === "results"}
      />
    );
  return (
    <div className="center-page">
      <h1>This property isn’t on the map.</h1>
      <Link href="/">Head home →</Link>
    </div>
  );
}
