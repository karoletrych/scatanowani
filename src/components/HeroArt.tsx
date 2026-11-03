const INK = "#2b241a";

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(
      cy +
      radius * Math.sin(angle)
    ).toFixed(1)}`;
  }).join(" ");
}

type TileKind = "wheat" | "forest" | "pasture" | "brick" | "ore" | "wood" | "desert";

const TILE_COLORS: Record<TileKind, string> = {
  wheat: "#e7bc57",
  forest: "#5c8452",
  pasture: "#9cc274",
  brick: "#c66a41",
  ore: "#7f8794",
  wood: "#3f6b4d",
  desert: "#e6d1a2",
};

function TileGlyph({ kind }: { kind: TileKind }) {
  const stroke = INK;
  if (kind === "wheat") {
    return (
      <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.82">
        <path d="M0 22V-20" />
        <path d="M0 14c-9 0-14-6-14-14M0 14c9 0 14-6 14-14" />
        <path d="M0 2C-8 2-12-3-12-10M0 2C8 2 12-3 12-10" />
        <path d="M0-8c-6 0-9-4-9-9M0-8c6 0 9-4 9-9" />
      </g>
    );
  }
  if (kind === "forest") {
    return (
      <g stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" fill="none" opacity="0.82">
        <path d="M-14 20 0-4 14 20Z" />
        <path d="M-10 6 0-18 10 6Z" />
        <path d="M0 20v8" />
      </g>
    );
  }
  if (kind === "pasture") {
    return (
      <g stroke={stroke} strokeWidth="2.1" strokeLinecap="round" fill="none" opacity="0.82">
        <path d="M-18 16c-4-9 3-17 11-15 2-7 12-8 15-2 6-1 10 4 7 10-2 5-9 7-16 7Z" />
        <path d="M-6 16v7M8 16v7M-18 8c-4 0-6 2-6 5M20 10c3 0 5 1 6 3" />
      </g>
    );
  }
  if (kind === "brick") {
    return (
      <g stroke={stroke} strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.82">
        <rect x="-20" y="-16" width="40" height="12" rx="2" />
        <rect x="-20" y="-2" width="19" height="12" rx="2" />
        <rect x="1" y="-2" width="19" height="12" rx="2" />
        <rect x="-20" y="12" width="40" height="12" rx="2" />
      </g>
    );
  }
  if (kind === "ore") {
    return (
      <g stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" fill="none" opacity="0.82">
        <path d="m-22 14 6-20 12-6 14 4 8 12-5 14-18 4Z" />
        <path d="m-6 4 10-6 10 4-3 10-12 2Z" />
      </g>
    );
  }
  if (kind === "desert") {
    return (
      <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75">
        <circle cx="0" cy="-2" r="10" />
        <path d="M0-20v-5M0 16v5M-18-2h-5M18-2h5M-13-15l-4-4M13 11l4 4M13-15l4-4M-13 11l-4 4" />
        <path d="M-20 24c6-5 12-5 18 0M2 24c6-5 12-5 18 0" />
      </g>
    );
  }
  return (
    <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.82">
      <path d="M0 22V-6" />
      <path d="M0 2c-10 0-16-5-16-13 9 0 16 5 16 13Z" />
      <path d="M0-4c10 0 16-5 16-13-9 0-16 5-16 13Z" />
    </g>
  );
}

type Tile = { x: number; y: number; kind: TileKind };

const RADIUS = 62;
const TILES: Tile[] = [
  { x: 260, y: 208, kind: "desert" },
  { x: 152, y: 208, kind: "pasture" },
  { x: 368, y: 208, kind: "brick" },
  { x: 206, y: 115, kind: "wheat" },
  { x: 314, y: 115, kind: "forest" },
  { x: 206, y: 301, kind: "ore" },
  { x: 314, y: 301, kind: "wood" },
];

function Meeple({
  x,
  y,
  scale = 1,
  color,
  rotate = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  color: string;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <circle cx="0" cy="-24" r="9" fill={color} stroke={INK} strokeWidth="2.4" />
      <path
        d="M-21-6c8-8 14-10 21-10s13 2 21 10l6 15H11v22h-22V9h-16Z"
        fill={color}
        stroke={INK}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Die({
  x,
  y,
  size = 46,
  rotate = 0,
  color = "#f9f0da",
  pips,
}: {
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  color?: string;
  pips: Array<[number, number]>;
}) {
  const half = size / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect
        x={-half}
        y={-half}
        width={size}
        height={size}
        rx={size * 0.22}
        fill={color}
        stroke={INK}
        strokeWidth="2.6"
      />
      {pips.map(([px, py], index) => (
        <circle key={index} cx={px * size} cy={py * size} r={size * 0.075} fill={INK} />
      ))}
    </g>
  );
}

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 420"
      role="img"
      aria-label="Ilustracja hexowej planszy w stylu Catan z pionkami i kośćmi"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff8e7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tile-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
        </linearGradient>
        <filter id="tile-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#3a2a14" floodOpacity="0.22" />
        </filter>
      </defs>

      <ellipse cx="260" cy="372" rx="188" ry="26" fill="#3a2a14" opacity="0.12" />
      <circle cx="260" cy="208" r="205" fill="url(#hero-glow)" />

      <g filter="url(#tile-shadow)">
        {TILES.map((tile) => (
          <g key={`${tile.x}-${tile.y}`}>
            <polygon
              points={hexPoints(tile.x, tile.y, RADIUS)}
              fill={TILE_COLORS[tile.kind]}
              stroke={INK}
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <polygon
              points={hexPoints(tile.x, tile.y, RADIUS - 2)}
              fill="url(#tile-shine)"
              stroke="none"
            />
            <g transform={`translate(${tile.x} ${tile.y + 2})`}>
              <TileGlyph kind={tile.kind} />
            </g>
          </g>
        ))}
      </g>

      {/* porty / drogi */}
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.5">
        <path d="M206 83 260 52l54 31" fill="none" />
        <path d="M98 208h-26M422 208h26" />
      </g>

      <Meeple x={258} y={242} scale={0.86} color="#c4562f" />
      <Meeple x={330} y={300} scale={0.66} color="#2f6d7a" rotate={-8} />
      <Meeple x={174} y={168} scale={0.6} color="#d9a83c" rotate={8} />

      <Die x={96} y={330} rotate={-12} pips={[[-0.22, -0.22], [0.22, 0.22]]} />
      <Die
        x={148}
        y={352}
        size={40}
        rotate={9}
        color="#c4562f"
        pips={[
          [-0.22, -0.22],
          [0, 0],
          [0.22, 0.22],
        ]}
      />

      <g transform="translate(372 62) rotate(8)">
        <rect
          x="-40"
          y="-26"
          width="80"
          height="52"
          rx="8"
          fill="#f9f0da"
          stroke={INK}
          strokeWidth="2.4"
        />
        <polygon
          points={hexPoints(0, 0, 14)}
          fill="#e7bc57"
          stroke={INK}
          strokeWidth="2"
        />
        <path d="M-28 12h56" stroke={INK} strokeWidth="2" opacity="0.25" strokeLinecap="round" />
        <path d="M-28-13h22" stroke={INK} strokeWidth="2.5" opacity="0.35" strokeLinecap="round" />
      </g>

      <g transform="translate(72 82) rotate(-9)">
        <rect
          x="-34"
          y="-23"
          width="68"
          height="46"
          rx="7"
          fill="#fffaf0"
          stroke={INK}
          strokeWidth="2.2"
          opacity="0.92"
        />
        <path d="M-20-6h40M-20 4h28" stroke={INK} strokeWidth="2.6" opacity="0.32" strokeLinecap="round" />
        <circle cx="20" cy="12" r="4" fill="#2f6d7a" opacity="0.7" />
      </g>

      <g fill="#2f5d3a" opacity="0.5">
        <circle cx="438" cy="318" r="3" />
        <circle cx="456" cy="296" r="2" />
        <circle cx="60" cy="252" r="2.4" />
        <circle cx="86" cy="274" r="1.8" />
      </g>
    </svg>
  );
}
