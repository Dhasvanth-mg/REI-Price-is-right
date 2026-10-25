export type Phase =
  | "lobby"
  | "intro"
  | "guessing"
  | "locked"
  | "reveal"
  | "leaderboard"
  | "finished";
export type Property = {
  id: string;
  address: string;
  city: string;
  category: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  acres?: number;
  type: string;
  facts: string[];
  images: string[];
  source: string;
};
export type Settings = {
  roundSeconds: number;
  sessionMinutes: number;
  roundCount: number;
  finalMultiplier: number;
  exactBonus: number;
  thresholds: number[];
  points: number[];
  filterNames: boolean;
  teamMode: boolean;
  closestUnder: boolean;
  challenge: boolean;
  wagerEnabled: boolean;
  wagerPoints: number;
  wagerThreshold: number;
};
export type Player = {
  id: string;
  tokenHash: string;
  name: string;
  emoji: string;
  team: string;
  captain: boolean;
  banned: boolean;
  joined: number;
  bonus: number;
};
export type Guess = {
  playerId: string;
  amount: number;
  submitted: number;
  reason: string;
  wager: boolean;
};
export type Round = { guesses: Guess[]; property: Property; scored: boolean };
export type Game = {
  code: string;
  owner: string;
  title: string;
  revision: number;
  controlRevision?: number;
  created: number;
  started: number | null;
  phase: Phase;
  index: number;
  deadline: number | null;
  paused: number | null;
  settings: Settings;
  players: Player[];
  rounds: Round[];
  commands: string[];
};
export type Score = {
  id: string;
  name: string;
  emoji: string;
  team: string;
  points: number;
  roundPoints: number;
  lastRoundPoints: number;
  error: number;
  exact: number;
  submitted: number;
  streak: number;
  guess: number | null;
  difference: number | null;
  percentage: number | null;
  rank: number;
};
export type PublicGame = {
  code: string;
  title: string;
  revision: number;
  controlRevision: number;
  phase: Phase;
  index: number;
  total: number;
  deadline: number | null;
  paused: number | null;
  sessionDeadline: number | null;
  serverNow: number;
  settings: Settings;
  players: Omit<Player, "tokenHash">[];
  property: Omit<Property, "price" | "source"> & {
    price?: number;
    source?: string;
  };
  submitted: number;
  leaderboard: Score[];
  roundLeaderboard: Score[];
  me?: { id: string; guess: Guess | null };
  isHost: boolean;
  history?: { code: string; title: string; phase: Phase }[];
};
export const defaults: Settings = {
  roundSeconds: 45,
  sessionMinutes: 20,
  roundCount: 10,
  finalMultiplier: 2,
  exactBonus: 5,
  thresholds: [2, 5, 10, 20],
  points: [10, 7, 5, 2],
  filterNames: true,
  teamMode: false,
  closestUnder: false,
  challenge: false,
  wagerEnabled: false,
  wagerPoints: 5,
  wagerThreshold: 10,
};
export const emojis = [
  "🏡",
  "🦊",
  "🐸",
  "🦋",
  "🐼",
  "🦁",
  "🐙",
  "🦄",
  "🌵",
  "🍄",
  "🪩",
  "💎",
  "🔥",
  "🌙",
  "🚀",
  "🍒",
];
