import { SignAsset } from '@/types/isl';

/**
 * Embedded SVG generator for ISL signs to ensure immediate, zero-network,
 * 100% offline availability of visual sign representations.
 */
function createSignSvg(title: string, subtext: string, iconType: string, accentColor: string = '#6366f1'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="24" fill="url(#bgGrad)" stroke="#334155" stroke-width="3" />
    
    <!-- Outer Glow Circle -->
    <circle cx="200" cy="180" r="110" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,6" opacity="0.4" />
    <circle cx="200" cy="180" r="90" fill="${accentColor}" fill-opacity="0.1" />

    <!-- Visual Sign Silhouette / Glyphs -->
    <g transform="translate(140, 120) scale(1.5)">
      ${getIconSvgPath(iconType)}
    </g>

    <!-- Sign Title Badge -->
    <rect x="50" y="300" width="300" height="52" rx="14" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
    <text x="200" y="333" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#f8fafc" text-anchor="middle">
      ${title}
    </text>
    <text x="200" y="375" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="13" fill="#94a3b8" text-anchor="middle">
      ${subtext}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getIconSvgPath(type: string): string {
  switch (type) {
    case 'namaste':
      // Two palms pressed together
      return `<path d="M40 70 L40 25 C40 18 35 15 30 18 L20 28 L20 65 Z" fill="#818cf8" />
              <path d="M40 70 L40 25 C40 18 45 15 50 18 L60 28 L60 65 Z" fill="#c7d2fe" />
              <circle cx="40" cy="15" r="5" fill="#facc15" />`;
    case 'hello':
      // Open hand wave
      return `<path d="M25 65 L25 35 C25 28 32 25 35 32 L35 65 Z" fill="#818cf8" />
              <path d="M37 65 L37 20 C37 14 44 14 44 20 L44 65 Z" fill="#a5b4fc" />
              <path d="M46 65 L46 24 C46 18 53 18 53 24 L53 65 Z" fill="#818cf8" />
              <path d="M55 65 L55 35 C55 30 62 30 62 35 L62 65 Z" fill="#6366f1" />`;
    case 'thank-you':
      // Hand moving out from chin/chest
      return `<path d="M30 30 C30 20 50 20 50 30 L50 60 C50 68 30 68 30 60 Z" fill="#818cf8" />
              <path d="M50 45 L70 30 L70 50 Z" fill="#facc15" />`;
    case 'water':
      // 'W' gesture or cupped hand to mouth
      return `<path d="M40 20 C20 40 20 60 40 70 C60 60 60 40 40 20 Z" fill="#38bdf8" />
              <path d="M35 50 Q40 40 45 50" stroke="#ffffff" stroke-width="3" fill="none" />`;
    case 'help':
      // One hand supporting the other
      return `<rect x="15" y="55" width="50" height="12" rx="4" fill="#64748b" />
              <path d="M35 55 L35 25 C35 18 45 18 45 25 L45 55 Z" fill="#f43f5e" />
              <circle cx="40" cy="18" r="4" fill="#facc15" />`;
    case 'question':
      // Question mark shape gesture
      return `<text x="40" y="60" font-size="55" font-family="system-ui" font-weight="900" fill="#f59e0b" text-anchor="middle">?</text>`;
    case 'finger':
      // Pointing index finger
      return `<path d="M35 65 L35 20 C35 12 45 12 45 20 L45 65 Z" fill="#818cf8" />
              <rect x="25" y="45" width="30" height="25" rx="5" fill="#4f46e5" />`;
    case 'heart':
      return `<path d="M40 30 C30 15 15 25 25 45 L40 65 L55 45 C65 25 50 15 40 30 Z" fill="#f43f5e" />`;
    case 'check':
      return `<path d="M20 45 L35 60 L65 25" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
    case 'cross':
      return `<path d="M25 25 L55 55 M55 25 L25 55" stroke="#ef4444" stroke-width="8" stroke-linecap="round" fill="none" />`;
    default:
      // Generic hand symbol
      return `<circle cx="40" cy="40" r="24" fill="#818cf8" />
              <text x="40" y="48" font-size="22" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">ISL</text>`;
  }
}

/**
 * Built-in Core ISL Sign Asset Registry
 */
export const SIGN_ASSET_REGISTRY: Record<string, SignAsset> = {
  // GREETINGS & SOCIAL
  'HELLO': {
    token: 'HELLO',
    type: 'svg',
    url: createSignSvg('HELLO', 'Open palm wave from temple outward', 'hello'),
    label: 'Hello / Hi',
    description: 'Flat open palm starts near temple and moves forward and outward with gentle wave.',
    category: 'greeting',
  },
  'NAMASTE': {
    token: 'NAMASTE',
    type: 'svg',
    url: createSignSvg('NAMASTE', 'Both palms pressed together at chest', 'namaste', '#f59e0b'),
    label: 'Namaste',
    description: 'Traditional Indian greeting: Both hands flat, palms touching together in front of chest with slight bow.',
    category: 'greeting',
  },
  'THANK-YOU': {
    token: 'THANK-YOU',
    type: 'svg',
    url: createSignSvg('THANK-YOU', 'Fingers touch chin and move forward', 'thank-you', '#10b981'),
    label: 'Thank You',
    description: 'Flat hand tips lightly touch chin or chest, then extend outward toward the other person.',
    category: 'greeting',
  },
  'WELCOME': {
    token: 'WELCOME',
    type: 'svg',
    url: createSignSvg('WELCOME', 'Open hands sweep inward warmly', 'hello', '#10b981'),
    label: 'Welcome',
    description: 'Both palms facing upward, sweeping gently inward toward the chest.',
    category: 'greeting',
  },
  'PLEASE': {
    token: 'PLEASE',
    type: 'svg',
    url: createSignSvg('PLEASE', 'Circular rub over chest with flat palm', 'namaste', '#a855f7'),
    label: 'Please',
    description: 'Flat open palm placed on center of chest, making gentle circular clockwise motion.',
    category: 'greeting',
  },
  'SORRY': {
    token: 'SORRY',
    type: 'svg',
    url: createSignSvg('SORRY', 'Closed fist circular motion over chest', 'help', '#ef4444'),
    label: 'Sorry / Apologies',
    description: 'Closed fist rubs circular on chest with apologetic facial expression.',
    category: 'greeting',
  },
  'YES': {
    token: 'YES',
    type: 'svg',
    url: createSignSvg('YES', 'Fist nods up and down like a head', 'check', '#10b981'),
    label: 'Yes',
    description: 'Closed fist nods up and down at wrist level, mimicking a head nod.',
    category: 'common',
  },
  'NO': {
    token: 'NO',
    type: 'svg',
    url: createSignSvg('NO', 'Index and middle fingers snap to thumb', 'cross', '#ef4444'),
    label: 'No',
    description: 'Extended index and middle fingers tap firmly down onto the thumb, or index finger shakes side-to-side.',
    category: 'common',
  },

  // COMMON NEEDS & OBJECTS
  'WATER': {
    token: 'WATER',
    type: 'svg',
    url: createSignSvg('WATER', 'Cupped hand tipped near mouth', 'water', '#06b6d4'),
    label: 'Water',
    description: 'Cupped dominant hand tilts gently near mouth, as if drinking water from palm.',
    category: 'common',
  },
  'FOOD': {
    token: 'FOOD',
    type: 'svg',
    url: createSignSvg('FOOD', 'Flattened fingers tap near mouth', 'water', '#f97316'),
    label: 'Food / Eat',
    description: 'Fingertips brought together touching thumb, tapping twice toward mouth.',
    category: 'common',
  },
  'HELP': {
    token: 'HELP',
    type: 'svg',
    url: createSignSvg('HELP', 'Thumbs-up on flat support palm lifted', 'help', '#f43f5e'),
    label: 'Help / Assist',
    description: 'Dominant fist with thumb extended sits on flat palm of non-dominant hand; both move upward together.',
    category: 'emergency',
  },
  'DOCTOR': {
    token: 'DOCTOR',
    type: 'svg',
    url: createSignSvg('DOCTOR', 'Fingertips tap pulse at wrist', 'help', '#0ea5e9'),
    label: 'Doctor / Medical',
    description: 'Dominant index/middle fingers tap the inner wrist pulse point of the non-dominant arm.',
    category: 'emergency',
  },
  'HOSPITAL': {
    token: 'HOSPITAL',
    type: 'svg',
    url: createSignSvg('HOSPITAL', 'Draw cross on shoulder / arm', 'help', '#ef4444'),
    label: 'Hospital',
    description: 'Index finger traces a small cross symbol on the upper shoulder or arm.',
    category: 'emergency',
  },

  // QUESTIONS
  'WHAT': {
    token: 'WHAT',
    type: 'svg',
    url: createSignSvg('WHAT', 'Both open palms up shaking gently', 'question', '#eab308'),
    label: 'What',
    description: 'Both hands held open with palms facing upward, moving side-to-side with furrowed eyebrows.',
    category: 'question',
  },
  'WHERE': {
    token: 'WHERE',
    type: 'svg',
    url: createSignSvg('WHERE', 'Index finger shakes side-to-side', 'question', '#eab308'),
    label: 'Where',
    description: 'Index finger points upward, waving slightly side to side with inquisitive facial expression.',
    category: 'question',
  },
  'WHY': {
    token: 'WHY',
    type: 'svg',
    url: createSignSvg('WHY', 'Touch forehead and pull down to Y-hand', 'question', '#eab308'),
    label: 'Why',
    description: 'Hand touches forehead and pulls down with inquiring expression.',
    category: 'question',
  },
  'HOW': {
    token: 'HOW',
    type: 'svg',
    url: createSignSvg('HOW', 'Curved hands roll outward to open palms', 'question', '#eab308'),
    label: 'How',
    description: 'Backs of curved fingers touching, rotating outward so palms face up.',
    category: 'question',
  },
  'NAME': {
    token: 'NAME',
    type: 'svg',
    url: createSignSvg('NAME', 'H-fingers tapping crosswise', 'finger', '#8b5cf6'),
    label: 'Name',
    description: 'Index and middle fingers extended tap across the other hand fingers.',
    category: 'common',
  },

  // PRONOUNS & TIME
  'ME': {
    token: 'ME',
    type: 'svg',
    url: createSignSvg('ME', 'Index finger points to own chest', 'finger', '#6366f1'),
    label: 'I / Me / My',
    description: 'Dominant index finger points gently toward center of own chest.',
    category: 'pronoun',
  },
  'YOU': {
    token: 'YOU',
    type: 'svg',
    url: createSignSvg('YOU', 'Index finger points toward person', 'finger', '#6366f1'),
    label: 'You / Your',
    description: 'Index finger points directly forward toward the conversational partner.',
    category: 'pronoun',
  },
  'TODAY': {
    token: 'TODAY',
    type: 'svg',
    url: createSignSvg('TODAY', 'Both Y-hands move down twice', 'finger', '#3b82f6'),
    label: 'Today / Now',
    description: 'Both hands move downwards sharply twice in front of the body.',
    category: 'common',
  },
  'TOMORROW': {
    token: 'TOMORROW',
    type: 'svg',
    url: createSignSvg('TOMORROW', 'Thumb moves forward from cheek', 'finger', '#3b82f6'),
    label: 'Tomorrow',
    description: 'Thumb of dominant hand arcs forward from cheek.',
    category: 'common',
  },
  'YESTERDAY': {
    token: 'YESTERDAY',
    type: 'svg',
    url: createSignSvg('YESTERDAY', 'Thumb arcs backward over shoulder', 'finger', '#3b82f6'),
    label: 'Yesterday',
    description: 'Thumb of dominant hand arcs backward over shoulder to denote past time.',
    category: 'common',
  },
};

/**
 * Generate A-Z ISL Fingerspelling Handshape Assets.
 * In ISL, fingerspelling is two-handed and standardized across India.
 */
for (let i = 65; i <= 90; i++) {
  const letter = String.fromCharCode(i);
  SIGN_ASSET_REGISTRY[letter] = {
    token: letter,
    type: 'fingerspell',
    url: createSignSvg(`LETTER ${letter}`, `ISL Two-Handed Alphabet: ${letter}`, 'finger', '#6366f1'),
    label: `Letter ${letter}`,
    description: `Indian Sign Language two-handed fingerspelling representation for letter "${letter}".`,
    category: 'alphabet',
  };
}

/**
 * Generate 0-10 numbers
 */
for (let num = 0; num <= 10; num++) {
  const str = String(num);
  SIGN_ASSET_REGISTRY[str] = {
    token: str,
    type: 'svg',
    url: createSignSvg(`NUMBER ${str}`, `ISL Number Sign: ${str}`, 'finger', '#14b8a6'),
    label: `Number ${str}`,
    description: `Standard Indian Sign Language counting sign for "${str}".`,
    category: 'number',
  };
}

export class SignAssetRegistryService {
  public static getAsset(token: string): SignAsset | undefined {
    const normalized = token.toUpperCase().trim();
    return SIGN_ASSET_REGISTRY[normalized];
  }

  public static getAllAssets(): SignAsset[] {
    return Object.values(SIGN_ASSET_REGISTRY);
  }

  public static getAssetsByCategory(category: SignAsset['category']): SignAsset[] {
    return Object.values(SIGN_ASSET_REGISTRY).filter((a) => a.category === category);
  }

  public static searchAssets(query: string): SignAsset[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllAssets();
    return Object.values(SIGN_ASSET_REGISTRY).filter(
      (a) =>
        a.token.toLowerCase().includes(q) ||
        a.label.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }
}
