
export type QuizCategoryId =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'volleyball'
  | 'boxing'
  | 'random';

export type QuizQuestion = {
  id: string;
  prompt: string;
  a: string;
  b: string;
  correct: 'A' | 'B';
  fact: string;
  category: QuizCategoryId;
};

export type QuizCategory = {
  id: QuizCategoryId;
  title: string;
  isLocked: boolean;
  illustration: any;
};

export const CATEGORIES: QuizCategory[] = [
  {
    id: 'football',
    title: 'Football',
    isLocked: false,
    illustration: require('../assets/sport_football.png'),
  },
  {
    id: 'basketball',
    title: 'Basketball',
    isLocked: false,
    illustration: require('../assets/sport_basketball.png'),
  },
  {
    id: 'tennis',
    title: 'Tennis',
    isLocked: true,
    illustration: require('../assets/sport_tennis.png'),
  },
  {
    id: 'volleyball',
    title: 'Volleyball',
    isLocked: true,
    illustration: require('../assets/sport_volleyball.png'),
  },
  {
    id: 'boxing',
    title: 'Boxing',
    isLocked: true,
    illustration: require('../assets/sport_boxing.png'),
  },
  {
    id: 'random',
    title: 'Random',
    isLocked: true,
    illustration: require('../assets/sport_random.png'),
  },
];

export const FOOTBALL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'f1',
    category: 'football',
    prompt: 'Who is taller?',
    a: 'Erling Haaland',
    b: 'Kylian Mbappé',
    correct: 'A',
    fact: 'Erling Haaland is 194 cm tall, while Kylian Mbappé is 178 cm.',
  },
  {
    id: 'f2',
    category: 'football',
    prompt: 'Who scored more Premier League goals?',
    a: 'Alan Shearer',
    b: 'Wayne Rooney',
    correct: 'A',
    fact: 'Alan Shearer scored 260 Premier League goals, Wayne Rooney scored 208.',
  },
  {
    id: 'f3',
    category: 'football',
    prompt: 'Who won more Champions League titles?',
    a: 'Cristiano Ronaldo',
    b: 'Lionel Messi',
    correct: 'A',
    fact: 'Cristiano Ronaldo won 5 Champions League titles, Lionel Messi won 4.',
  },
  {
    id: 'f4',
    category: 'football',
    prompt: 'Who played more matches for their national team?',
    a: 'Gianluigi Buffon',
    b: 'Manuel Neuer',
    correct: 'A',
    fact: 'Gianluigi Buffon played 176 international matches, Manuel Neuer played 117.',
  },
  {
    id: 'f5',
    category: 'football',
    prompt: 'Who scored more goals for their national team?',
    a: 'Cristiano Ronaldo',
    b: 'Neymar',
    correct: 'A',
    fact: 'Cristiano Ronaldo scored 128 international goals, Neymar scored 79.',
  },
  {
    id: 'f6',
    category: 'football',
    prompt: 'Who has more career assists in club football?',
    a: 'Lionel Messi',
    b: 'Kevin De Bruyne',
    correct: 'A',
    fact: 'Lionel Messi recorded over 350 club assists, Kevin De Bruyne recorded over 250.',
  },
  {
    id: 'f7',
    category: 'football',
    prompt: "Who won more Ballon d'Or awards?",
    a: 'Lionel Messi',
    b: 'Cristiano Ronaldo',
    correct: 'A',
    fact: "Lionel Messi won 8 Ballon d'Or awards, Cristiano Ronaldo won 5.",
  },
  {
    id: 'f8',
    category: 'football',
    prompt: 'Who scored more goals in a single league season?',
    a: 'Lionel Messi',
    b: 'Robert Lewandowski',
    correct: 'A',
    fact: 'Lionel Messi scored 50 league goals in one season, Robert Lewandowski scored 41.',
  },
  {
    id: 'f9',
    category: 'football',
    prompt: 'Who made more appearances in La Liga?',
    a: 'Sergio Busquets',
    b: 'Xavi Hernández',
    correct: 'B',
    fact: 'Sergio Busquets made over 500 La Liga appearances, Xavi made 505.',
  },
  {
    id: 'f10',
    category: 'football',
    prompt: 'Who has more Champions League goals?',
    a: 'Cristiano Ronaldo',
    b: 'Lionel Messi',
    correct: 'A',
    fact: 'Cristiano Ronaldo scored 140 Champions League goals, Lionel Messi scored 129.',
  },
  {
    id: 'f11',
    category: 'football',
    prompt: 'Who won more league titles?',
    a: 'Dani Alves',
    b: 'Andrés Iniesta',
    correct: 'A',
    fact: 'Dani Alves won over 23 league titles, Andrés Iniesta won 18.',
  },
  {
    id: 'f12',
    category: 'football',
    prompt: 'Who scored more goals as a defender?',
    a: 'Sergio Ramos',
    b: 'Virgil van Dijk',
    correct: 'A',
    fact: 'Sergio Ramos scored over 100 career goals, Virgil van Dijk scored under 50.',
  },
  {
    id: 'f13',
    category: 'football',
    prompt: 'Who played more club matches?',
    a: 'Luka Modrić',
    b: 'Toni Kroos',
    correct: 'A',
    fact: 'Luka Modrić played over 750 club matches, Toni Kroos played over 700.',
  },
  {
    id: 'f14',
    category: 'football',
    prompt: 'Who has more international caps?',
    a: 'Luka Modrić',
    b: 'Andrés Iniesta',
    correct: 'A',
    fact: 'Luka Modrić earned 178 international caps, Andrés Iniesta earned 131.',
  },
  {
    id: 'f15',
    category: 'football',
    prompt: 'Who won more Golden Boots?',
    a: 'Lionel Messi',
    b: 'Cristiano Ronaldo',
    correct: 'A',
    fact: 'Lionel Messi won 6 European Golden Boots, Cristiano Ronaldo won 4.',
  },
  {
    id: 'f16',
    category: 'football',
    prompt: 'Who scored more goals before age 23?',
    a: 'Kylian Mbappé',
    b: 'Erling Haaland',
    correct: 'A',
    fact: 'Kylian Mbappé scored over 200 career goals before age 23, Erling Haaland scored fewer.',
  },
  {
    id: 'f17',
    category: 'football',
    prompt: 'Who made more assists in Premier League history?',
    a: 'Ryan Giggs',
    b: 'Cesc Fàbregas',
    correct: 'A',
    fact: 'Ryan Giggs recorded 162 Premier League assists, Cesc Fàbregas recorded 111.',
  },
  {
    id: 'f18',
    category: 'football',
    prompt: 'Who won more international trophies?',
    a: 'Lionel Messi',
    b: 'Neymar',
    correct: 'A',
    fact: 'Lionel Messi won 3 major international trophies, Neymar won 1.',
  },
  {
    id: 'f19',
    category: 'football',
    prompt: 'Who played more Champions League matches?',
    a: 'Iker Casillas',
    b: 'Gianluigi Buffon',
    correct: 'A',
    fact: 'Iker Casillas played 177 Champions League matches, Gianluigi Buffon played 124.',
  },
  {
    id: 'f20',
    category: 'football',
    prompt: 'Who scored more career goals?',
    a: 'Cristiano Ronaldo',
    b: 'Robert Lewandowski',
    correct: 'A',
    fact: 'Cristiano Ronaldo scored over 850 official career goals, Robert Lewandowski scored over 600.',
  },
];

export const BASKETBALL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'b1',
    category: 'basketball',
    prompt: 'Who scored more career points?',
    a: 'LeBron James',
    b: 'Kareem Abdul-Jabbar',
    correct: 'A',
    fact: 'LeBron James scored over 40,000 career points, while Kareem Abdul-Jabbar scored 38,387.',
  },
  {
    id: 'b2',
    category: 'basketball',
    prompt: 'Who won more NBA championships?',
    a: 'Michael Jordan',
    b: 'LeBron James',
    correct: 'A',
    fact: 'Michael Jordan won 6 NBA titles, LeBron James won 4.',
  },
  {
    id: 'b3',
    category: 'basketball',
    prompt: 'Who has more career assists?',
    a: 'John Stockton',
    b: 'Chris Paul',
    correct: 'A',
    fact: 'John Stockton recorded 15,806 career assists, Chris Paul recorded over 11,000.',
  },
  {
    id: 'b4',
    category: 'basketball',
    prompt: 'Who made more three-pointers in NBA history?',
    a: 'Stephen Curry',
    b: 'Ray Allen',
    correct: 'A',
    fact: 'Stephen Curry made over 3,700 three-pointers, Ray Allen made 2,973.',
  },
  {
    id: 'b5',
    category: 'basketball',
    prompt: 'Who averaged more points per game in their career?',
    a: 'Michael Jordan',
    b: 'Kobe Bryant',
    correct: 'A',
    fact: 'Michael Jordan averaged 30.1 points per game, Kobe Bryant averaged 25.0.',
  },
  {
    id: 'b6',
    category: 'basketball',
    prompt: 'Who grabbed more career rebounds?',
    a: 'Wilt Chamberlain',
    b: 'Shaquille O’Neal',
    correct: 'A',
    fact: 'Wilt Chamberlain collected 23,924 rebounds, Shaquille O’Neal collected 13,099.',
  },
  {
    id: 'b7',
    category: 'basketball',
    prompt: 'Who recorded more triple-doubles?',
    a: 'Russell Westbrook',
    b: 'Oscar Robertson',
    correct: 'A',
    fact: 'Russell Westbrook recorded over 200 triple-doubles, Oscar Robertson recorded 181.',
  },
  {
    id: 'b8',
    category: 'basketball',
    prompt: 'Who won more MVP awards?',
    a: 'LeBron James',
    b: 'Stephen Curry',
    correct: 'A',
    fact: 'LeBron James won 4 MVP awards, Stephen Curry won 2.',
  },
  {
    id: 'b9',
    category: 'basketball',
    prompt: 'Who blocked more shots in their career?',
    a: 'Hakeem Olajuwon',
    b: 'Dikembe Mutombo',
    correct: 'A',
    fact: 'Hakeem Olajuwon recorded 3,830 blocks, Dikembe Mutombo recorded 3,289.',
  },
  {
    id: 'b10',
    category: 'basketball',
    prompt: 'Who scored more points in a single NBA game?',
    a: 'Wilt Chamberlain',
    b: 'Kobe Bryant',
    correct: 'A',
    fact: 'Wilt Chamberlain scored 100 points in one game, Kobe Bryant scored 81.',
  },
  {
    id: 'b11',
    category: 'basketball',
    prompt: 'Who played more NBA seasons?',
    a: 'Vince Carter',
    b: 'Dirk Nowitzki',
    correct: 'A',
    fact: 'Vince Carter played 22 NBA seasons, Dirk Nowitzki played 21.',
  },
  {
    id: 'b12',
    category: 'basketball',
    prompt: 'Who won more Finals MVP awards?',
    a: 'Michael Jordan',
    b: 'LeBron James',
    correct: 'A',
    fact: 'Michael Jordan won 6 Finals MVPs, LeBron James won 4.',
  },
  {
    id: 'b13',
    category: 'basketball',
    prompt: 'Who has more career steals?',
    a: 'John Stockton',
    b: 'Gary Payton',
    correct: 'A',
    fact: 'John Stockton recorded 3,265 steals, Gary Payton recorded 2,445.',
  },
  {
    id: 'b14',
    category: 'basketball',
    prompt: 'Who scored more playoff points?',
    a: 'LeBron James',
    b: 'Michael Jordan',
    correct: 'A',
    fact: 'LeBron James scored over 8,000 playoff points, Michael Jordan scored 5,987.',
  },
  {
    id: 'b15',
    category: 'basketball',
    prompt: 'Who won more Defensive Player of the Year awards?',
    a: 'Dwight Howard',
    b: 'Kawhi Leonard',
    correct: 'A',
    fact: 'Dwight Howard won 3 DPOY awards, Kawhi Leonard won 2.',
  },
  {
    id: 'b16',
    category: 'basketball',
    prompt: 'Who averaged more rebounds per game?',
    a: 'Dennis Rodman',
    b: 'Tim Duncan',
    correct: 'A',
    fact: 'Dennis Rodman averaged 13.1 rebounds per game, Tim Duncan averaged 10.8.',
  },
  {
    id: 'b17',
    category: 'basketball',
    prompt: 'Who scored more points in their rookie season?',
    a: 'Luka Dončić',
    b: 'Kevin Durant',
    correct: 'B',
    fact: 'Luka Dončić scored 1,470 points as a rookie, Kevin Durant scored 1,620.',
  },
  {
    id: 'b18',
    category: 'basketball',
    prompt: 'Who won more Olympic gold medals?',
    a: 'Kevin Durant',
    b: 'LeBron James',
    correct: 'A',
    fact: 'Kevin Durant won 3 Olympic gold medals, LeBron James won 2.',
  },
  {
    id: 'b19',
    category: 'basketball',
    prompt: 'Who made more free throws in their career?',
    a: 'Karl Malone',
    b: 'Kobe Bryant',
    correct: 'A',
    fact: 'Karl Malone made 9,787 free throws, Kobe Bryant made 8,378.',
  },
  {
    id: 'b20',
    category: 'basketball',
    prompt: 'Who played more playoff games?',
    a: 'LeBron James',
    b: 'Derek Fisher',
    correct: 'A',
    fact: 'LeBron James played over 280 playoff games, Derek Fisher played 259.',
  },
];

export const TENNIS_QUESTIONS: QuizQuestion[] = [];
export const VOLLEYBALL_QUESTIONS: QuizQuestion[] = [];
export const BOXING_QUESTIONS: QuizQuestion[] = [];

const POOLS: Record<Exclude<QuizCategoryId, 'random'>, QuizQuestion[]> = {
  football: FOOTBALL_QUESTIONS,
  basketball: BASKETBALL_QUESTIONS,
  tennis: TENNIS_QUESTIONS,
  volleyball: VOLLEYBALL_QUESTIONS,
  boxing: BOXING_QUESTIONS,
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function uniqueById(list: QuizQuestion[]): QuizQuestion[] {
  const m = new Map<string, QuizQuestion>();
  for (const q of list) m.set(q.id, q);
  return Array.from(m.values());
}

export function randomizeAnswerOrder(q: QuizQuestion): QuizQuestion {
  const moveCorrectToA = Math.random() < 0.5;

  if (moveCorrectToA) {
    if (q.correct === 'A') return { ...q };
    return { ...q, a: q.b, b: q.a, correct: 'A' };
  } else {
    if (q.correct === 'B') return { ...q };
    return { ...q, a: q.b, b: q.a, correct: 'B' };
  }
}

export function getRandomPool(): QuizQuestion[] {
  const all: QuizQuestion[] = uniqueById([
    ...POOLS.football,
    ...POOLS.basketball,
    ...POOLS.tennis,
    ...POOLS.volleyball,
    ...POOLS.boxing,
  ]);
  return shuffle(all);
}

export function getPoolByCategory(id: QuizCategoryId): QuizQuestion[] {
  if (id === 'random') return getRandomPool();
  return POOLS[id] ?? [];
}

export function buildRoundQuestions(categoryId: QuizCategoryId, count: number): QuizQuestion[] {
  const target = Math.max(1, Math.floor(count));

  let pool = getPoolByCategory(categoryId);

  if (!pool.length) {
    pool = getRandomPool();
  }

  if (!pool.length) {
    return [];
  }

  const out: QuizQuestion[] = [];
  while (out.length < target) {
    const batch = shuffle(pool);
    for (const q of batch) {
      out.push(q);
      if (out.length >= target) break;
    }
  }

  return out.slice(0, target).map(randomizeAnswerOrder);
}

export function pickQuestions(pool: QuizQuestion[], count: number): QuizQuestion[] {
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
