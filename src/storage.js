// StorageService — localStorage persistence layer for the app
const STORAGE_KEYS = {
  QUIT_DATE: 'rzucajnik_quit_date',
  JOURNAL: 'rzucajnik_journal',
  SETTINGS: 'rzucajnik_settings',
  ONBOARDED: 'rzucajnik_onboarded',
  BASELINE_PUFFS: 'rzucajnik_baseline_puffs',
  BADGES: 'rzucajnik_badges',
};

export const StorageService = {
  // ===== Quit Date =====
  getQuitDate() {
    const d = localStorage.getItem(STORAGE_KEYS.QUIT_DATE);
    return d ? new Date(d) : null;
  },

  setQuitDate(date) {
    localStorage.setItem(STORAGE_KEYS.QUIT_DATE, date.toISOString());
  },

  // ===== Journal Entries =====
  getJournal() {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return raw ? JSON.parse(raw) : [];
  },

  addJournalEntry(entry) {
    const journal = this.getJournal();
    journal.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      ...entry,
    });
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journal));
    return journal;
  },

  getTodayEntry() {
    const journal = this.getJournal();
    const today = new Date().toDateString();
    return journal.find(e => new Date(e.date).toDateString() === today) || null;
  },

  // ===== Settings =====
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {
      dailyCost: 15, // PLN per day
      cigarettesPerDay: 0,
      name: '',
    };
  },

  setSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ===== Onboarding =====
  isOnboarded() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  },

  setOnboarded() {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
  },

  // ===== Baseline Puffs =====
  getBaselinePuffs() {
    const val = localStorage.getItem(STORAGE_KEYS.BASELINE_PUFFS);
    return val ? parseInt(val, 10) : null;
  },

  setBaselinePuffs(puffs) {
    localStorage.setItem(STORAGE_KEYS.BASELINE_PUFFS, puffs.toString());
  },

  // ===== Badges =====
  getBadges() {
    const raw = localStorage.getItem(STORAGE_KEYS.BADGES);
    return raw ? JSON.parse(raw) : [];
  },

  addBadge(badgeId) {
    const badges = this.getBadges();
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    }
    return badges;
  },

  // ===== Reset =====
  resetAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};

// ===== Milestones Data =====
export const HEALTH_MILESTONES = [
  {
    id: 'milestone_20min',
    time: 20 * 60 * 1000,
    title: '20 minut',
    description: 'Tętno i ciśnienie krwi normalizują się',
    icon: '❤️',
  },
  {
    id: 'milestone_8h',
    time: 8 * 60 * 60 * 1000,
    title: '8 godzin',
    description: 'Poziom tlenku węgla wraca do normy',
    icon: '🫁',
  },
  {
    id: 'milestone_24h',
    time: 24 * 60 * 60 * 1000,
    title: '24 godziny',
    description: 'Tlenek węgla usunięty z organizmu',
    icon: '🧹',
  },
  {
    id: 'milestone_48h',
    time: 48 * 60 * 60 * 1000,
    title: '48 godzin',
    description: 'Zmysł smaku i węchu się poprawia',
    icon: '👃',
  },
  {
    id: 'milestone_72h',
    time: 72 * 60 * 60 * 1000,
    title: '72 godziny',
    description: 'Oddychanie staje się łatwiejsze',
    icon: '🌬️',
  },
  {
    id: 'milestone_1w',
    time: 7 * 24 * 60 * 60 * 1000,
    title: '1 tydzień',
    description: 'Lepsze krążenie krwi',
    icon: '🩸',
  },
  {
    id: 'milestone_2w',
    time: 14 * 24 * 60 * 60 * 1000,
    title: '2 tygodnie',
    description: 'Płuca zaczynają się regenerować',
    icon: '🏃',
  },
  {
    id: 'milestone_1m',
    time: 30 * 24 * 60 * 60 * 1000,
    title: '1 miesiąc',
    description: 'Wydolność wzrasta o 30%',
    icon: '💪',
  },
  {
    id: 'milestone_3m',
    time: 90 * 24 * 60 * 60 * 1000,
    title: '3 miesiące',
    description: 'Funkcja płuc poprawia się nawet o 30%',
    icon: '🏆',
  },
  {
    id: 'milestone_1y',
    time: 365 * 24 * 60 * 60 * 1000,
    title: '1 rok',
    description: 'Ryzyko chorób serca spada o połowę',
    icon: '🎉',
  },
];

// ===== Badges Data =====
export const BADGE_DEFINITIONS = [
  { id: 'badge_1d', name: '1 Dzień', icon: '⭐', requirement: 1 },
  { id: 'badge_3d', name: '3 Dni', icon: '🌟', requirement: 3 },
  { id: 'badge_7d', name: 'Tydzień', icon: '🔥', requirement: 7 },
  { id: 'badge_14d', name: '2 Tygodnie', icon: '💎', requirement: 14 },
  { id: 'badge_30d', name: 'Miesiąc', icon: '👑', requirement: 30 },
  { id: 'badge_90d', name: '3 Miesiące', icon: '🏅', requirement: 90 },
  { id: 'badge_180d', name: 'Pół Roku', icon: '🎖️', requirement: 180 },
  { id: 'badge_365d', name: 'Rok!', icon: '🏆', requirement: 365 },
  { id: 'badge_journal3', name: '3 Notatki', icon: '📝', requirement: 'journal_3' },
  { id: 'badge_journal7', name: '7 Notatek', icon: '📖', requirement: 'journal_7' },
  { id: 'badge_journal30', name: '30 Notatek', icon: '📚', requirement: 'journal_30' },
  { id: 'badge_sos', name: 'Przetrwałeś', icon: '🛟', requirement: 'sos_used' },
];

// ===== Motivational Quotes =====
export const MOTIVATIONAL_QUOTES = [
  'Każda minuta bez bucha to zwycięstwo.',
  'Twoje płuca Ci dziękują.',
  'Silniejszy niż nawyk.',
  'Jeden dzień na raz — dasz radę!',
  'Twoje ciało się regeneruje właśnie teraz.',
  'Wolność smakuje lepiej niż dym.',
  'Jesteś silniejszy niż myślisz.',
  'Każdy dzień bez palenia to prezent dla siebie.',
  'Twoje zdrowie jest najcenniejsze.',
  'Oddychaj pełną piersią!',
];
