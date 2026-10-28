import { useId } from 'react';

/**
 * Hand-built SVG illustrations in the Yatra palette.
 * Decorative only (aria-hidden) — they never carry data.
 */
const G = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffd879" />
      <stop offset="1" stopColor="#e08a3c" />
    </linearGradient>
    <linearGradient id={`${id}-copper`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#e08a3c" />
      <stop offset="1" stopColor="#a8501d" />
    </linearGradient>
    <linearGradient id={`${id}-cream`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fffdf9" />
      <stop offset="1" stopColor="#f6efe3" />
    </linearGradient>
  </defs>
);

const scenes = {
  passes: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="58" ry="8" fill="#3d1f0d" opacity=".08" />
      <path d="M22 96 C 50 70, 70 120, 100 90 S 140 60, 146 40" fill="none" stroke="#d9cab3" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round" />
      <g transform="rotate(-10 72 76)">
        <rect x="30" y="50" width="88" height="54" rx="10" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
        <rect x="30" y="50" width="88" height="14" rx="10" fill={`url(#${id}-copper)`} />
        <rect x="30" y="58" width="88" height="6" fill={`url(#${id}-copper)`} />
        <line x1="92" y1="68" x2="92" y2="100" stroke="#d9cab3" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="40" y="72" width="38" height="5" rx="2.5" fill="#3d1f0d" opacity=".75" />
        <rect x="40" y="82" width="28" height="4" rx="2" fill="#bfb2a5" />
        <rect x="40" y="90" width="34" height="4" rx="2" fill="#bfb2a5" />
        <circle cx="105" cy="84" r="7" fill="#fdf2d2" stroke="#f0b100" strokeWidth="1.5" />
      </g>
      <g className="ill-float">
        <path d="M138 18 c-9 0-16 7-16 16 0 12 16 26 16 26 s16-14 16-26 c0-9-7-16-16-16z" fill={`url(#${id}-gold)`} />
        <circle cx="138" cy="34" r="6" fill="#fffdf9" />
      </g>
    </>
  ),
  complaints: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="56" ry="8" fill="#3d1f0d" opacity=".08" />
      <rect x="34" y="44" width="92" height="80" rx="14" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
      <rect x="48" y="60" width="44" height="6" rx="3" fill="#3d1f0d" opacity=".7" />
      <rect x="48" y="74" width="62" height="4" rx="2" fill="#bfb2a5" />
      <rect x="48" y="84" width="54" height="4" rx="2" fill="#bfb2a5" />
      <rect x="48" y="102" width="30" height="10" rx="5" fill="#e7f0e7" />
      <circle cx="54" cy="107" r="2.5" fill="#5f8f6c" />
      <g className="ill-float" transform="rotate(35 122 40)">
        <rect x="116" y="18" width="12" height="48" rx="6" fill={`url(#${id}-copper)`} />
        <path d="M110 18 a12 12 0 1 1 24 0 l-6 0 l0 8 l-12 0 l0 -8z" fill={`url(#${id}-gold)`} />
      </g>
      <path d="M26 40 l8 -14 l-2 10 l8 0 l-8 14 l2 -10z" fill="#f0b100" />
      <path d="M140 96 c0 6 -4 10 -8 10 s-8 -4 -8 -10 c0 -6 8 -14 8 -14 s8 8 8 14z" fill="#9fc2dd" />
    </>
  ),
  food: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="60" ry="8" fill="#3d1f0d" opacity=".08" />
      <ellipse cx="80" cy="112" rx="58" ry="12" fill="#efe5d4" />
      <ellipse cx="80" cy="108" rx="58" ry="12" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
      <path d="M38 104 a42 40 0 0 1 84 0z" fill={`url(#${id}-gold)`} />
      <path d="M50 96 a30 28 0 0 1 22 -24" fill="none" stroke="#fffdf9" strokeWidth="4" strokeLinecap="round" opacity=".6" />
      <rect x="74" y="56" width="12" height="8" rx="4" fill={`url(#${id}-copper)`} />
      <g className="ill-steam" stroke="#d9cab3" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M66 46 c-6 -8 6 -12 0 -20" />
        <path d="M80 42 c-6 -8 6 -12 0 -20" />
        <path d="M94 46 c-6 -8 6 -12 0 -20" />
      </g>
    </>
  ),
  approvals: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="54" ry="8" fill="#3d1f0d" opacity=".08" />
      <circle cx="44" cy="70" r="14" fill="#efe5d4" />
      <circle cx="44" cy="64" r="6" fill="#bfb2a5" />
      <path d="M33 80 a11 9 0 0 1 22 0z" fill="#bfb2a5" />
      <circle cx="116" cy="70" r="14" fill="#efe5d4" />
      <circle cx="116" cy="64" r="6" fill="#bfb2a5" />
      <path d="M105 80 a11 9 0 0 1 22 0z" fill="#bfb2a5" />
      <g className="ill-float">
        <path d="M80 22 l34 12 v26 c0 26 -20 42 -34 50 c-14 -8 -34 -24 -34 -50 v-26z" fill={`url(#${id}-gold)`} />
        <path d="M80 30 l26 9 v21 c0 20 -15 33 -26 39z" fill="#fffdf9" opacity=".25" />
        <path d="M66 64 l10 10 l20 -22" fill="none" stroke="#3d1f0d" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  ),
  gate: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="62" ry="8" fill="#3d1f0d" opacity=".08" />
      <path d="M80 128 L64 128 L74 92 L86 92 L96 128z" fill="#efe5d4" />
      <rect x="22" y="48" width="18" height="80" rx="3" fill={`url(#${id}-copper)`} />
      <rect x="120" y="48" width="18" height="80" rx="3" fill={`url(#${id}-copper)`} />
      <path d="M22 52 Q80 4 138 52" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="9" strokeLinecap="round" />
      <rect x="18" y="40" width="26" height="10" rx="3" fill="#3d1f0d" />
      <rect x="116" y="40" width="26" height="10" rx="3" fill="#3d1f0d" />
      <g stroke="#d9cab3" strokeWidth="3" strokeLinecap="round">
        <line x1="50" y1="62" x2="50" y2="126" /><line x1="62" y1="54" x2="62" y2="126" />
        <line x1="98" y1="54" x2="98" y2="126" /><line x1="110" y1="62" x2="110" y2="126" />
      </g>
      <circle className="ill-float" cx="80" cy="30" r="7" fill="#f0b100" />
    </>
  ),
  search: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="50" ry="8" fill="#3d1f0d" opacity=".08" />
      <rect x="30" y="40" width="70" height="80" rx="12" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
      <rect x="42" y="56" width="40" height="5" rx="2.5" fill="#bfb2a5" />
      <rect x="42" y="68" width="30" height="4" rx="2" fill="#e4d6c0" />
      <rect x="42" y="78" width="36" height="4" rx="2" fill="#e4d6c0" />
      <g className="ill-float">
        <circle cx="104" cy="72" r="22" fill="#fffdf9" fillOpacity=".7" stroke={`url(#${id}-copper)`} strokeWidth="7" />
        <path d="M120 88 l18 18" stroke={`url(#${id}-copper)`} strokeWidth="9" strokeLinecap="round" />
      </g>
    </>
  ),
  error: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="50" ry="8" fill="#3d1f0d" opacity=".08" />
      <path d="M44 96 a20 20 0 0 1 4 -40 a28 28 0 0 1 54 -6 a22 22 0 0 1 14 46z" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
      <path className="ill-float" d="M84 78 l-14 22 h12 l-6 22 l20 -30 h-12 l8 -14z" fill="#b9524a" />
    </>
  ),
  inbox: (id) => (
    <>
      <ellipse cx="80" cy="132" rx="54" ry="8" fill="#3d1f0d" opacity=".08" />
      <path d="M30 86 l16 -40 h68 l16 40 v28 a8 8 0 0 1 -8 8 h-84 a8 8 0 0 1 -8 -8z" fill={`url(#${id}-cream)`} stroke="#e4d6c0" strokeWidth="1.5" />
      <path d="M30 86 h30 a20 14 0 0 0 40 0 h30" fill="none" stroke="#d9cab3" strokeWidth="2" />
      <g className="ill-float"><circle cx="80" cy="44" r="10" fill={`url(#${id}-gold)`} /></g>
    </>
  ),
};

export function Illustration({ name = 'inbox', size = 160, className = '' }) {
  const id = `ill${useId().replace(/:/g, '')}`;
  const scene = scenes[name] || scenes.inbox;
  return (
    <svg className={`illustration ${className}`} viewBox="0 0 160 140" width={size} height={(size * 140) / 160} aria-hidden focusable="false">
      <G id={id} />
      {scene(id)}
    </svg>
  );
}

/** Line-art campus skyline for dark hero panels. */
export function CampusSkyline({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const line = `sky-line-${uid}`;
  const fill = `sky-fill-${uid}`;
  return (
    <svg className={`skyline ${className}`} viewBox="0 0 520 220" aria-hidden focusable="false" preserveAspectRatio="xMaxYMax meet">
      <defs>
        <linearGradient id={line} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd879" stopOpacity=".95" />
          <stop offset="1" stopColor="#e08a3c" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c449" stopOpacity=".14" />
          <stop offset="1" stopColor="#f6c449" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="skyline__moon">
        <circle cx="440" cy="46" r="20" fill="#f6c449" opacity=".9" />
        <circle cx="450" cy="40" r="18" fill="#2e170b" />
      </g>
      <g className="skyline__stars" fill="#ffd879">
        <circle cx="300" cy="30" r="1.6" /><circle cx="360" cy="62" r="1.2" /><circle cx="250" cy="70" r="1.3" />
        <circle cx="490" cy="96" r="1.4" /><circle cx="395" cy="22" r="1.1" />
      </g>
      <g fill={`url(#${fill})`} stroke={`url(#${line})`} strokeWidth="1.6" strokeLinejoin="round">
        {/* left wing */}
        <path d="M110 210 V120 h90 v90" />
        {/* central tower */}
        <path d="M200 210 V96 l40 -30 l40 30 V210" />
        <path d="M228 66 V44 h24 v22" />
        {/* right wing */}
        <path d="M280 210 V112 h120 v98" />
        {/* far block */}
        <path d="M400 210 V140 h70 v70" />
      </g>
      <circle cx="240" cy="110" r="12" fill="none" stroke="#ffd879" strokeWidth="1.6" opacity=".9" />
      <path d="M240 110 v-7 M240 110 l5 3" stroke="#ffd879" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M222 210 v-30 a18 18 0 0 1 36 0 v30" fill="none" stroke={`url(#${line})`} strokeWidth="1.6" />
      <g fill="#f6c449" className="skyline__windows">
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <rect key={`l${r}${c}`} x={122 + c * 20} y={134 + r * 24} width="9" height="12" rx="1.5" opacity={(r + c) % 3 === 0 ? 0.85 : 0.22} />
        )))}
        {[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => (
          <rect key={`r${r}${c}`} x={294 + c * 21} y={128 + r * 24} width="9" height="12" rx="1.5" opacity={(r * 2 + c) % 4 === 1 ? 0.85 : 0.22} />
        )))}
        {[0, 1].map((r) => [0, 1, 2].map((c) => (
          <rect key={`f${r}${c}`} x={412 + c * 20} y={154 + r * 24} width="9" height="12" rx="1.5" opacity={(r + c) % 2 ? 0.8 : 0.2} />
        )))}
      </g>
      <g fill="none" stroke={`url(#${line})`} strokeWidth="1.6">
        <circle cx="70" cy="182" r="20" /><path d="M70 202 v8" />
        <circle cx="40" cy="192" r="13" /><path d="M40 205 v5" />
        <circle cx="492" cy="188" r="15" /><path d="M492 203 v7" />
      </g>
      <path d="M0 210 H520" stroke={`url(#${line})`} strokeWidth="1.6" />
    </svg>
  );
}
