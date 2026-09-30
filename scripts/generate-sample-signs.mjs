import fs from 'node:fs';
import path from 'node:path';

const signs = [
  { name: 'thank-you', label: 'THANK-YOU', sub: 'Hand moving outwards from chin', color: '#10b981' },
  { name: 'water', label: 'WATER', sub: 'W-handshape tapped near side of chin', color: '#06b6d4' },
  { name: 'tomorrow', label: 'TOMORROW', sub: 'Thumb flips forward from cheek', color: '#8b5cf6' },
  { name: 'school', label: 'SCHOOL', sub: 'Palms clapping twice horizontally', color: '#f59e0b' },
  { name: 'i', label: 'I / ME', sub: 'Index finger pointing to center chest', color: '#6366f1' },
  { name: 'you', label: 'YOU', sub: 'Index finger pointing directly to partner', color: '#3b82f6' },
  { name: 'go', label: 'GO', sub: 'Both index fingers rolling outward forward', color: '#ec4899' },
  { name: 'hospital', label: 'HOSPITAL', sub: 'H-fingers tracing cross on upper arm', color: '#ef4444' },
  { name: 'doctor', label: 'DOCTOR', sub: 'Tips of M-fingers touching inside wrist pulse', color: '#14b8a6' },
  { name: 'help', label: 'HELP', sub: 'Fist on flat palm lifted upward', color: '#f97316' },
  { name: 'yes', label: 'YES', sub: 'Fist nodding up and down', color: '#22c55e' },
  { name: 'no', label: 'NO', sub: 'Index and middle fingers snapping onto thumb', color: '#e11d48' },
  { name: 'please', label: 'PLEASE', sub: 'Flat palm rubbing circle on chest', color: '#a855f7' },
  { name: 'food', label: 'FOOD / EAT', sub: 'Squished O-hand touching lips repeatedly', color: '#eab308' },
  { name: 'pain', label: 'PAIN', sub: 'Both index fingers twisting toward each other', color: '#dc2626' },
  { name: 'police', label: 'POLICE', sub: 'C-hand tapping over chest badge area', color: '#2563eb' },
  { name: 'ambulance', label: 'AMBULANCE', sub: 'Twisting emergency beacon hand gesture', color: '#f43f5e' },
  { name: 'where', label: 'WHERE', sub: 'Both open palms face up shrugging side to side', color: '#64748b' },
  { name: 'what', label: 'WHAT', sub: 'Index fingers wiggling side to side', color: '#64748b' }
];

const dir = path.join('public', 'signs', 'svg');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const s of signs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" rx="24" fill="#0f172a" stroke="#334155" stroke-width="3" />
  <circle cx="200" cy="170" r="100" fill="${s.color}" fill-opacity="0.1" stroke="${s.color}" stroke-width="2" stroke-dasharray="6,6" />
  <g transform="translate(130, 95) scale(1.4)">
    <rect x="20" y="20" width="60" height="60" rx="16" fill="${s.color}" fill-opacity="0.2" stroke="${s.color}" stroke-width="2" />
    <circle cx="50" cy="50" r="16" fill="${s.color}" fill-opacity="0.8" />
    <text x="50" y="55" font-family="monospace" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">ISL</text>
  </g>
  <rect x="40" y="295" width="320" height="52" rx="14" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
  <text x="200" y="328" font-family="system-ui, sans-serif" font-weight="700" font-size="20" fill="#f8fafc" text-anchor="middle">${s.label}</text>
  <text x="200" y="372" font-family="system-ui, sans-serif" font-weight="500" font-size="13" fill="#94a3b8" text-anchor="middle">${s.sub}</text>
</svg>`;

  fs.writeFileSync(path.join(dir, `${s.name}.svg`), svg, 'utf8');
}

console.log(`Generated ${signs.length} local sign SVG assets.`);
