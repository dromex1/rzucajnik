import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageService, HEALTH_MILESTONES, BADGE_DEFINITIONS, MOTIVATIONAL_QUOTES } from './storage';
import { useTimer, useBreathing, useToast } from './hooks';
import {
  Timer, Camera, Notebook, Heart, Award, Settings, Home, ChevronLeft,
  TrendingDown, TrendingUp, Minus, Flame, Shield, Wind,
  AlertCircle, Check, X, Plus, Clock, Calendar, BookOpen, Zap,
  CircleDollarSign, Activity, Trophy, Star,
  RotateCcw, User, CreditCard, FileText,
  Sparkles, HandHeart, Brain, Eye, Cloud, LogOut
} from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './index.css';

// ==========================================
// Relapse & Auth Modals
// ==========================================
function LoginModal({ onClose, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async () => {
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        StorageService.backupToCloud();
        showToast('Konto utworzone i zalogowano!');
        onClose();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const restored = await StorageService.restoreFromCloud(auth.currentUser.uid);
        if (restored) {
          showToast('Zalogowano i przywrócono dane!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Zalogowano pomyślnie!');
          onClose();
        }
      }
    } catch (error) {
      showToast('Błąd: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const restored = await StorageService.restoreFromCloud(auth.currentUser.uid);
      if (restored) {
        showToast('Zalogowano i przywrócono dane!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        StorageService.backupToCloud();
        showToast('Zalogowano pomyślnie!');
        onClose();
      }
    } catch (error) {
      showToast('Błąd Google: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isRegistering ? 'Zarejestruj się' : 'Zaloguj się'}</h2>
        <p style={{marginBottom: '16px'}}>Zabezpiecz swoje statystyki w chmurze.</p>
        <div className="input-group">
          <input type="email" className="input-field" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" className="input-field mt-sm" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-full mt-md" onClick={handleSubmit}>
          {isRegistering ? 'Stwórz konto' : 'Zaloguj e-mailem'}
        </button>
        <button className="btn btn-full mt-sm" style={{background: '#fff', color: '#333', border: '1px solid #ddd'}} onClick={handleGoogleLogin}>
          <svg style={{width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Zaloguj przez Google
        </button>
        <button className="btn btn-ghost btn-full mt-sm" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
        </button>
        <button className="btn btn-ghost btn-full mt-sm" onClick={onClose}>Anuluj</button>
      </div>
    </div>
  );
}

function RelapseModal({ onClose, moneySavedDisplay, daysSaved, onReset }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Potknąłeś się?</h2>
        <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>
          To tylko jedno potknięcie, a nie przegrana wojna! <br/><br/>
          Zaoszczędziłeś już <b>{moneySavedDisplay} zł</b> i wytrzymałeś <b>{daysSaved} dni</b>.
          Zaczynamy od nowa?
        </p>
        <button className="btn btn-primary btn-full mt-md" onClick={() => {
          onReset();
          onClose();
        }}>
          Zresetuj licznik
        </button>
        <button className="btn btn-ghost btn-full mt-sm" onClick={onClose}>Anuluj</button>
      </div>
    </div>
  );
}

// ==========================================
// Onboarding Screen
// ==========================================
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [costPeriod, setCostPeriod] = useState('monthly');
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [puffs, setPuffs] = useState('');

  const periodLabels = { daily: 'Dziennie', weekly: 'Tygodniowo', monthly: 'Miesięcznie' };

  const handlePhotoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = () => {
    const rawCost = parseFloat(cost) || 15;
    let dailyCost = rawCost;
    if (costPeriod === 'weekly') dailyCost = rawCost / 7;
    if (costPeriod === 'monthly') dailyCost = rawCost / 30;
    StorageService.setSettings({ name, dailyCost, costPeriod, rawCost });

    const puffCount = parseInt(puffs, 10) || 0;
    if (puffCount > 0) StorageService.setBaselinePuffs(puffCount);

    // Save first photo entry
    StorageService.addJournalEntry({
      note: 'Pierwszy dzień bez palenia — startuje nową drogę!',
      photo,
      puffs: puffCount,
      puffStatus: 'neutral',
    });

    StorageService.setOnboarded();
    onComplete();
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="app-container">
        <div className="onboarding">
          <div className="onboarding-icon">
            <Shield size={64} strokeWidth={1.5} />
          </div>
          <h1>Rzucajnik</h1>
          <p>
            Twoja podróż do wolności od nikotyny zaczyna się tutaj.
            Śledź postępy, monitoruj zdrowie i kontroluj każdy dzień.
          </p>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(1)}>
            <Sparkles size={20} />
            Zaczynam
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Name + Cost
  if (step === 1) {
    return (
      <div className="app-container">
        <div className="onboarding">
          <div className="onboarding-icon">
            <User size={48} strokeWidth={1.5} />
          </div>
          <h1>O Tobie</h1>
          <p>Podaj swoje imię i ile wydajesz na palenie.</p>
          <div className="input-group">
            <label className="input-label">Twoje imię</label>
            <input
              type="text"
              className="input-field"
              placeholder="np. Dominik"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label className="input-label">Wydatki na palenie (PLN)</label>
            <div className="period-selector">
              {['daily', 'weekly', 'monthly'].map(period => (
                <button
                  key={period}
                  className={`period-btn ${costPeriod === period ? 'active' : ''}`}
                  onClick={() => setCostPeriod(period)}
                  type="button"
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="input-field"
              placeholder={costPeriod === 'daily' ? '15' : costPeriod === 'weekly' ? '100' : '300'}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-full btn-lg mt-lg"
            onClick={() => setStep(2)}
            disabled={!name.trim() || !cost.trim()}
          >
            Dalej
            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: First photo + puff count
  if (step === 2) {
    return (
      <div className="app-container">
        <div className="onboarding" style={{ justifyContent: 'flex-start', paddingTop: '80px' }}>
          <div className="onboarding-icon">
            <Camera size={48} strokeWidth={1.5} />
          </div>
          <h1>Punkt startowy</h1>
          <p>
            Zrób zdjęcie ekranu swojego e-papierosa i wpisz aktualną liczbę buchów.
            To będzie Twoja baza — od teraz monitorujemy każdy dzień.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoFile}
          />

          {photo ? (
            <div style={{ width: '100%', marginBottom: '16px' }}>
              <img src={photo} alt="Zdjęcie e-papierosa" className="photo-preview" style={{ width: '100%', maxHeight: '220px' }} />
              <button className="btn btn-ghost btn-full mt-sm" onClick={() => fileRef.current?.click()}>
                <Camera size={16} />
                Zmień zdjęcie
              </button>
            </div>
          ) : (
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()} style={{ width: '100%' }}>
              <Camera size={36} strokeWidth={1.5} color="#8E8E93" />
              <div className="upload-text">Zrób zdjęcie ekranu</div>
              <div className="upload-hint">e-papierosa z licznikiem buchów</div>
            </div>
          )}

          <div className="input-group" style={{ width: '100%' }}>
            <label className="input-label">Liczba buchów na ekranie</label>
            <input
              type="number"
              className="input-field"
              placeholder="np. 450"
              value={puffs}
              onChange={(e) => setPuffs(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-full btn-lg mt-md"
            onClick={handleFinish}
            disabled={!photo || !puffs.trim()}
          >
            <Timer size={20} />
            Rozpocznij timer
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ==========================================
// Photo Upload Component
// ==========================================
function PhotoUpload({ onPhotoTaken, existingPhoto }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(existingPhoto || null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      onPhotoTaken(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
      {preview ? (
        <div>
          <img src={preview} alt="Zdjęcie e-papierosa" className="photo-preview" />
          <button className="btn btn-ghost mt-sm" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> Zmień zdjęcie
          </button>
        </div>
      ) : (
        <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
          <Camera size={36} strokeWidth={1.5} color="#8E8E93" />
          <div className="upload-text">Zrób zdjęcie ekranu</div>
          <div className="upload-hint">e-papierosa z licznikiem buchów</div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Breathing Exercise Modal
// ==========================================
function BreathingModal({ onClose }) {
  const { phase, timeLeft, cycle, totalCycles, start, stop, phaseLabel } = useBreathing();

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const circleSize = phase === 'inhale' || phase === 'hold' ? 1.3 : 1;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Oddychaj</h2>
        <p>Technika 4-7-8. Skup się na oddechu i pozwól głodowi nikotynowemu minąć.</p>
        <div
          className="breathing-circle"
          style={{
            transform: `scale(${circleSize})`,
            transition: phase === 'inhale' ? 'transform 4s ease-in-out' : phase === 'exhale' ? 'transform 8s ease-in-out' : 'none',
          }}
        >
          {phase === 'done' ? <Check size={40} /> : timeLeft}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          {phaseLabel}
        </div>
        {phase !== 'done' && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Cykl {cycle} z {totalCycles}
          </div>
        )}
        <button className="btn btn-ghost btn-full" onClick={onClose}>
          {phase === 'done' ? 'Gotowe — zamknij' : 'Zamknij'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 24h Photo Reminder Modal
// ==========================================
function PhotoReminderModal({ onSubmit, onSkip, baseline }) {
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [puffs, setPuffs] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const puffCount = parseInt(puffs, 10) || 0;
    let puffStatus = 'neutral';
    if (baseline !== null && puffCount > 0) {
      if (puffCount > baseline) puffStatus = 'bad';
      else if (puffCount < baseline) puffStatus = 'good';
    }
    onSubmit({ photo, puffs: puffCount, puffStatus });
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <Camera size={36} strokeWidth={1.5} color="var(--accent)" />
        </div>
        <h2>Dzienny check-in</h2>
        <p>Minęło 24h — zrób zdjęcie ekranu e-papierosa i wpisz aktualną liczbę buchów.</p>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />

        {photo ? (
          <div style={{ marginBottom: '16px' }}>
            <img src={photo} alt="Zdjęcie" className="photo-preview" style={{ width: '100%', maxHeight: '180px' }} />
            <button className="btn btn-ghost btn-full mt-sm" onClick={() => fileRef.current?.click()}>
              <Camera size={14} /> Zmień
            </button>
          </div>
        ) : (
          <div className="photo-upload-area" onClick={() => fileRef.current?.click()} style={{ marginBottom: '16px' }}>
            <Camera size={32} strokeWidth={1.5} color="#8E8E93" />
            <div className="upload-text">Zrób zdjęcie</div>
          </div>
        )}

        <div className="input-group" style={{ width: '100%', textAlign: 'left' }}>
          <label className="input-label">Liczba buchów (baza: {baseline})</label>
          <input
            type="number"
            className="input-field"
            placeholder="np. 430"
            value={puffs}
            onChange={(e) => setPuffs(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-full mt-md"
          onClick={handleSubmit}
          disabled={!photo || !puffs.trim()}
        >
          <Check size={18} /> Zapisz
        </button>
        <button className="btn btn-ghost btn-full mt-sm" onClick={onSkip}>
          Przypomnij później
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Home Screen
// ==========================================
function HomeScreen({ onNavigate }) {
  const [quitDate, setQuitDateLocal] = useState(StorageService.getQuitDate());
  const settings = StorageService.getSettings();
  const elapsed = useTimer(quitDate);
  const journal = StorageService.getJournal();
  const todayEntry = StorageService.getTodayEntry();
  const baseline = StorageService.getBaselinePuffs();
  const [showBreathing, setShowBreathing] = useState(false);
  const [showPhotoReminder, setShowPhotoReminder] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const daysSaved = elapsed.days;
  // Real-time money counter: dailyCost per day = dailyCost/86400 per second
  // totalMs gives us exact milliseconds elapsed
  const dailyCost = settings.dailyCost || 15;
  const moneySavedRaw = (elapsed.totalMs / (1000 * 60 * 60 * 24)) * dailyCost;
  const moneySavedDisplay = moneySavedRaw.toFixed(2);
  const quoteIndex = new Date().getMinutes() % MOTIVATIONAL_QUOTES.length;
  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

  // Check if 24h have passed without a photo entry
  useEffect(() => {
    if (!todayEntry && daysSaved >= 1) {
      // Check if the last entry is older than ~20 hours
      const lastEntry = journal[0];
      if (lastEntry) {
        const lastTime = new Date(lastEntry.date).getTime();
        const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
        if (hoursSince >= 20) {
          setShowPhotoReminder(true);
        }
      }
    }
  }, [todayEntry, daysSaved]);

  // Check badges
  useEffect(() => {
    const earnedBadges = StorageService.getBadges();
    BADGE_DEFINITIONS.forEach(badge => {
      if (typeof badge.requirement === 'number' && daysSaved >= badge.requirement && !earnedBadges.includes(badge.id)) {
        StorageService.addBadge(badge.id);
        showToast(`Nowa odznaka: ${badge.name}!`);
      }
    });
    if (journal.length >= 3 && !earnedBadges.includes('badge_journal3')) StorageService.addBadge('badge_journal3');
    if (journal.length >= 7 && !earnedBadges.includes('badge_journal7')) StorageService.addBadge('badge_journal7');
    if (journal.length >= 30 && !earnedBadges.includes('badge_journal30')) StorageService.addBadge('badge_journal30');
  }, [daysSaved, journal.length]);

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      const hasEntry = journal.some(e => new Date(e.date).toDateString() === dateStr);
      if (hasEntry || i === 0) { if (hasEntry) streak++; else break; } else break;
    }
    return streak;
  };
  const streak = calculateStreak();

  const handlePhotoSubmit = ({ photo, puffs, puffStatus }) => {
    StorageService.addJournalEntry({
      note: 'Dzienny check-in — zdjęcie ekranu e-papierosa',
      photo,
      puffs,
      puffStatus,
    });
    setShowPhotoReminder(false);
    showToast('Zdjęcie zapisane!');
  };

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="screen-header">
          <h1>Cześć, {settings.name || 'Bohaterze'}</h1>
          <div className="subtitle">Dzień {daysSaved + 1} bez palenia</div>
        </div>

        {/* Timer Hero Card */}
        {quitDate ? (
          <div className="timer-card">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="timer-label">
              <Timer size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Nie palisz już
            </div>
            <div className="timer-units">
              <div className="timer-unit">
                <span className="timer-unit-value">{elapsed.days}</span>
                <span className="timer-unit-label">Dni</span>
              </div>
              <div className="timer-unit">
                <span className="timer-unit-value">{String(elapsed.hours).padStart(2, '0')}</span>
                <span className="timer-unit-label">Godz</span>
              </div>
              <div className="timer-unit">
                <span className="timer-unit-value">{String(elapsed.minutes).padStart(2, '0')}</span>
                <span className="timer-unit-label">Min</span>
              </div>
              <div className="timer-unit">
                <span className="timer-unit-value">{String(elapsed.seconds).padStart(2, '0')}</span>
                <span className="timer-unit-label">Sek</span>
              </div>
            </div>
            <div className="timer-motivational">{quote}</div>
            <button className="btn btn-ghost mt-md" onClick={() => setShowRelapseModal(true)} style={{ width: '100%', color: 'rgba(255,255,255,0.7)', fontSize: '14px', background: 'rgba(255,255,255,0.1)' }}>
              <AlertCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Potknąłem się (Zapaliłem)
            </button>
          </div>
        ) : (
          <div className="timer-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="timer-label" style={{ marginBottom: '24px' }}>Wszystko gotowe</div>
            <button 
              className="btn btn-primary btn-full btn-lg" 
              onClick={() => {
                const now = new Date();
                StorageService.setQuitDate(now);
                setQuitDateLocal(now);
              }} 
              style={{ zIndex: 10, background: 'white', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.5px' }}
            >
              START
            </button>
            <div className="timer-motivational" style={{ marginTop: '24px' }}>Rozpocznij odliczanie, kiedy będziesz gotów.</div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-card-money">
            <CircleDollarSign size={24} />
            <div>
              <div className="stat-value money-ticker">{moneySavedDisplay} <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.85 }}>zł</span></div>
              <div className="stat-label">Zaoszczędzone</div>
            </div>
          </div>
          <div className="stat-card stat-card-health" onClick={() => onNavigate('milestones')}>
            <Heart size={24} />
            <div>
              <div className="stat-value">{HEALTH_MILESTONES.filter(m => elapsed.totalMs >= m.time).length}/{HEALTH_MILESTONES.length}</div>
              <div className="stat-label">Kamienie milowe</div>
            </div>
          </div>
          <div className="stat-card stat-card-streak">
            <Flame size={24} />
            <div>
              <div className="stat-value">{streak}</div>
              <div className="stat-label">Seria notatek</div>
            </div>
          </div>
          <div className="stat-card stat-card-badge" onClick={() => onNavigate('badges')}>
            <Award size={24} />
            <div>
              <div className="stat-value">{StorageService.getBadges().length}</div>
              <div className="stat-label">Odznaki</div>
            </div>
          </div>
        </div>

        {/* Daily Check-in CTA */}
        <div className="checkin-card" onClick={() => onNavigate('checkin')}>
          <div className="checkin-header">
            <div className="checkin-title">
              <Notebook size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Dzienna notatka
            </div>
            <span className={`checkin-status ${todayEntry ? 'done' : 'pending'}`}>
              {todayEntry ? (
                <><Check size={12} /> Zrobione</>
              ) : (
                <><Clock size={12} /> Czeka</>
              )}
            </span>
          </div>
          {!todayEntry && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Opisz jak się czujesz i zrób zdjęcie ekranu e-papierosa
            </p>
          )}
          {todayEntry && todayEntry.note && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{todayEntry.note.substring(0, 60)}..."
            </p>
          )}
        </div>

        {/* SOS Button */}
        <button className="sos-btn" onClick={() => setShowBreathing(true)}>
          <Wind size={28} />
          <div className="sos-text">
            <div className="sos-title">Głód nikotynowy?</div>
            <div className="sos-subtitle">Uruchom ćwiczenia oddechowe</div>
          </div>
        </button>

        {/* Auth Button */}
        {user ? (
          <button className="sos-btn" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(0,0,0,0.08)', marginTop: '12px' }} onClick={() => signOut(auth)}>
            <LogOut size={28} color="var(--text-secondary)" />
            <div className="sos-text">
              <div className="sos-title" style={{ color: 'var(--text-primary)' }}>Wyloguj się</div>
              <div className="sos-subtitle" style={{ color: 'var(--text-secondary)' }}>Zalogowano: {user.email}</div>
            </div>
          </button>
        ) : (
          <button className="sos-btn" style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #303050 100%)', marginTop: '12px' }} onClick={() => setShowLoginModal(true)}>
            <Cloud size={28} color="white" />
            <div className="sos-text">
              <div className="sos-title" style={{ color: 'white' }}>Zaloguj do chmury</div>
              <div className="sos-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Zabezpiecz i synchronizuj dane online</div>
            </div>
          </button>
        )}

        {/* Modals */}
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} showToast={showToast} />}
        {showRelapseModal && (
          <RelapseModal 
            onClose={() => setShowRelapseModal(false)} 
            moneySavedDisplay={moneySavedDisplay}
            daysSaved={daysSaved}
            onReset={() => {
              StorageService.setQuitDate(null);
              setQuitDateLocal(null);
              showToast('Licznik zresetowany. Powodzenia!');
            }}
          />
        )}
        
        {showBreathing && (
          <BreathingModal onClose={() => {
            setShowBreathing(false);
            const badges = StorageService.getBadges();
            if (!badges.includes('badge_sos')) {
              StorageService.addBadge('badge_sos');
              showToast('Odznaka: Przetrwałeś głód nikotynowy!');
            }
          }} />
        )}

        {showPhotoReminder && (
          <PhotoReminderModal
            baseline={baseline}
            onSubmit={handlePhotoSubmit}
            onSkip={() => setShowPhotoReminder(false)}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

// ==========================================
// Check-in Screen
// ==========================================
function CheckInScreen({ onNavigate }) {
  const todayEntry = StorageService.getTodayEntry();
  const baseline = StorageService.getBaselinePuffs();
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [puffs, setPuffs] = useState('');
  const [saved, setSaved] = useState(!!todayEntry);
  const { toast, showToast } = useToast();

  const charCount = note.length;
  const isValid = charCount >= 30 && photo;

  const handleSave = () => {
    if (!isValid) return;
    const puffCount = parseInt(puffs, 10) || 0;
    let puffStatus = 'neutral';
    if (baseline !== null && puffCount > 0) {
      if (puffCount > baseline) puffStatus = 'bad';
      else if (puffCount < baseline) puffStatus = 'good';
    }
    StorageService.addJournalEntry({ note, photo, puffs: puffCount, puffStatus });
    setSaved(true);
    showToast('Notatka zapisana!');
  };

  if (saved && todayEntry) {
    return (
      <div className="app-container">
        <div className="screen">
          <div className="screen-header">
            <h1>Dzisiejsza notatka</h1>
            <div className="subtitle">Świetna robota! Wróć jutro.</div>
          </div>
          <div className="journal-entry">
            <div className="entry-date">
              {new Date(todayEntry.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="entry-text">{todayEntry.note}</div>
            {todayEntry.photo && <img src={todayEntry.photo} alt="Zdjęcie" className="entry-photo" />}
            {todayEntry.puffs > 0 && (
              <div className={`entry-puffs ${todayEntry.puffStatus}`}>
                {todayEntry.puffStatus === 'good' && <TrendingDown size={14} />}
                {todayEntry.puffStatus === 'bad' && <TrendingUp size={14} />}
                {todayEntry.puffStatus === 'neutral' && <Minus size={14} />}
                {todayEntry.puffs} buchów
                {todayEntry.puffStatus === 'good' && ' — spadek!'}
                {todayEntry.puffStatus === 'bad' && ' — wzrost'}
                {todayEntry.puffStatus === 'neutral' && ' — bez zmian'}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-full mt-lg" onClick={() => onNavigate('home')}>
            <ChevronLeft size={18} /> Wróć na główną
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="screen">
        <div className="screen-header">
          <h1>Jak się dziś czujesz?</h1>
          <div className="subtitle">Opisz swój dzień i pokaż ekran e-papierosa</div>
        </div>

        <div className="checkin-card" style={{ boxShadow: 'none', border: '1px solid var(--bg-tertiary)' }}>
          <div className="checkin-title" style={{ marginBottom: '12px' }}>
            <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Twoja notatka
          </div>
          <textarea
            className="checkin-textarea"
            placeholder="Jak się czujesz? Opisz swoje emocje, samopoczucie..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
          <div className={`char-count ${charCount >= 30 ? 'valid' : charCount >= 20 ? 'warning' : ''}`}>
            {charCount}/30 {charCount < 30 ? `(jeszcze ${30 - charCount})` : ''}
            {charCount >= 30 && <Check size={12} style={{ verticalAlign: 'middle' }} />}
          </div>
        </div>

        <div className="checkin-card mt-md" style={{ boxShadow: 'none', border: '1px solid var(--bg-tertiary)' }}>
          <div className="checkin-title" style={{ marginBottom: '12px' }}>
            <Camera size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Zdjęcie ekranu e-papierosa
          </div>
          <PhotoUpload onPhotoTaken={setPhoto} />
        </div>

        <div className="checkin-card mt-md" style={{ boxShadow: 'none', border: '1px solid var(--bg-tertiary)' }}>
          <div className="checkin-title" style={{ marginBottom: '4px' }}>
            <Activity size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Liczba buchów
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {baseline ? `Twoja baza: ${baseline} buchów` : 'Wpisz aktualny odczyt'}
          </p>
          <input
            type="number"
            className="input-field"
            style={{ width: '100%', padding: '16px 24px', background: 'var(--bg-secondary)', borderRadius: '16px', fontSize: '17px' }}
            placeholder="np. 430"
            value={puffs}
            onChange={(e) => setPuffs(e.target.value)}
          />
        </div>

        <button
          className={`btn btn-full btn-lg mt-lg ${isValid ? 'btn-success' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={!isValid}
        >
          {isValid ? <><Check size={18} /> Zapisz notatkę</> : 'Uzupełnij wszystkie pola'}
        </button>

        <button className="btn btn-ghost btn-full mt-md" onClick={() => onNavigate('home')}>
          <ChevronLeft size={18} /> Wróć
        </button>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

// ==========================================
// Milestones Screen
// ==========================================
function MilestonesScreen({ onNavigate }) {
  const quitDate = StorageService.getQuitDate();
  const elapsed = useTimer(quitDate);

  const milestoneIcons = {
    'milestone_20min': <Heart size={20} />,
    'milestone_8h': <Wind size={20} />,
    'milestone_24h': <Wind size={20} />,
    'milestone_48h': <Eye size={20} />,
    'milestone_72h': <Wind size={20} />,
    'milestone_1w': <Activity size={20} />,
    'milestone_2w': <Wind size={20} />,
    'milestone_1m': <Zap size={20} />,
    'milestone_3m': <Trophy size={20} />,
    'milestone_1y': <Star size={20} />,
  };

  return (
    <div className="app-container">
      <div className="screen">
        <div className="screen-header">
          <h1>Zdrowie</h1>
          <div className="subtitle">Twoje ciało się regeneruje</div>
        </div>

        <div className="milestone-list">
          {HEALTH_MILESTONES.map((milestone) => {
            const completed = elapsed.totalMs >= milestone.time;
            const progress = Math.min(100, (elapsed.totalMs / milestone.time) * 100);
            const isNext = !completed && progress > 0;

            return (
              <div key={milestone.id} className={`milestone-item ${completed ? 'completed' : ''} ${isNext ? 'active' : ''}`}>
                <div className={`milestone-icon ${completed ? 'completed' : isNext ? 'active' : 'locked'}`}>
                  {completed ? <Check size={20} /> : (milestoneIcons[milestone.id] || <Heart size={20} />)}
                </div>
                <div className="milestone-info">
                  <div className="milestone-title">{milestone.title}</div>
                  <div className="milestone-desc">{milestone.description}</div>
                  {!completed && (
                    <div className="milestone-progress">
                      <div className="milestone-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-ghost btn-full mt-lg" onClick={() => onNavigate('home')}>
          <ChevronLeft size={18} /> Wróć
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Badges Screen
// ==========================================
function BadgesScreen({ onNavigate }) {
  const earnedBadges = StorageService.getBadges();

  const badgeIcons = {
    'badge_1d': <Star size={28} />,
    'badge_3d': <Sparkles size={28} />,
    'badge_7d': <Flame size={28} />,
    'badge_14d': <Zap size={28} />,
    'badge_30d': <Trophy size={28} />,
    'badge_90d': <Award size={28} />,
    'badge_180d': <Shield size={28} />,
    'badge_365d': <Trophy size={28} />,
    'badge_journal3': <FileText size={28} />,
    'badge_journal7': <BookOpen size={28} />,
    'badge_journal30': <Notebook size={28} />,
    'badge_sos': <HandHeart size={28} />,
  };

  return (
    <div className="app-container">
      <div className="screen">
        <div className="screen-header">
          <h1>Odznaki</h1>
          <div className="subtitle">{earnedBadges.length} z {BADGE_DEFINITIONS.length} zdobytych</div>
        </div>

        <div className="badges-grid">
          {BADGE_DEFINITIONS.map(badge => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <div key={badge.id} className="badge-item">
                <div className={`badge-icon ${earned ? 'earned' : 'locked'}`}>
                  {badgeIcons[badge.id] || <Star size={28} />}
                </div>
                <div className="badge-name">{badge.name}</div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-ghost btn-full mt-lg" onClick={() => onNavigate('home')}>
          <ChevronLeft size={18} /> Wróć
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Journal History Screen
// ==========================================
function JournalScreen({ onNavigate }) {
  const journal = StorageService.getJournal();

  return (
    <div className="app-container">
      <div className="screen">
        <div className="screen-header">
          <h1>Dziennik</h1>
          <div className="subtitle">{journal.length} wpisów</div>
        </div>

        {journal.length === 0 ? (
          <div className="empty-state">
            <Notebook size={48} strokeWidth={1.5} color="var(--text-tertiary)" />
            <div className="empty-title" style={{ marginTop: '16px' }}>Brak wpisów</div>
            <div className="empty-desc">Dodaj swoją pierwszą notatkę</div>
          </div>
        ) : (
          journal.map(entry => (
            <div key={entry.id} className="journal-entry">
              <div className="entry-date">
                {new Date(entry.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="entry-text">{entry.note}</div>
              {entry.photo && <img src={entry.photo} alt="Zdjęcie" className="entry-photo" />}
              {entry.puffs > 0 && (
                <div className={`entry-puffs ${entry.puffStatus}`}>
                  {entry.puffStatus === 'good' && <TrendingDown size={14} />}
                  {entry.puffStatus === 'bad' && <TrendingUp size={14} />}
                  {entry.puffStatus === 'neutral' && <Minus size={14} />}
                  {entry.puffs} buchów
                </div>
              )}
            </div>
          ))
        )}

        <button className="btn btn-ghost btn-full mt-lg" onClick={() => onNavigate('home')}>
          <ChevronLeft size={18} /> Wróć
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Settings Screen
// ==========================================
function SettingsScreen({ onNavigate, onReset }) {
  const settings = StorageService.getSettings();
  const quitDate = StorageService.getQuitDate();
  const journal = StorageService.getJournal();
  const [showConfirm, setShowConfirm] = useState(false);

  const periodLabel = settings.costPeriod === 'daily' ? 'dzień' : settings.costPeriod === 'weekly' ? 'tydzień' : 'miesiąc';

  return (
    <div className="app-container">
      <div className="screen">
        <div className="screen-header">
          <h1>Ustawienia</h1>
        </div>

        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-left">
              <div className="settings-icon" style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--accent)' }}>
                <User size={16} />
              </div>
              <span className="settings-label">Imię</span>
            </div>
            <span className="settings-value">{settings.name || '—'}</span>
          </div>
          <div className="settings-item">
            <div className="settings-left">
              <div className="settings-icon" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
                <CreditCard size={16} />
              </div>
              <span className="settings-label">Koszt</span>
            </div>
            <span className="settings-value">{settings.rawCost || settings.dailyCost} zł / {periodLabel}</span>
          </div>
          <div className="settings-item">
            <div className="settings-left">
              <div className="settings-icon" style={{ background: 'rgba(175,82,222,0.12)', color: 'var(--purple)' }}>
                <Calendar size={16} />
              </div>
              <span className="settings-label">Data rzucenia</span>
            </div>
            <span className="settings-value">{quitDate ? new Date(quitDate).toLocaleDateString('pl-PL') : '—'}</span>
          </div>
          <div className="settings-item">
            <div className="settings-left">
              <div className="settings-icon" style={{ background: 'rgba(255,149,0,0.12)', color: 'var(--orange)' }}>
                <FileText size={16} />
              </div>
              <span className="settings-label">Wpisy</span>
            </div>
            <span className="settings-value">{journal.length}</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <AlertCircle size={18} /> Strefa niebezpieczna
          </div>
          {!showConfirm ? (
            <button className="btn btn-danger btn-full" onClick={() => setShowConfirm(true)}>
              <RotateCcw size={16} /> Resetuj wszystkie dane
            </button>
          ) : (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--red)', marginBottom: '12px', textAlign: 'center' }}>
                Czy na pewno? Ta operacja usunie wszystkie dane!
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>
                  Anuluj
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { StorageService.resetAll(); onReset(); }}>
                  Tak, resetuj
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-ghost btn-full mt-lg" onClick={() => onNavigate('home')}>
          <ChevronLeft size={18} /> Wróć
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Main App
// ==========================================
export default function App() {
  const [screen, setScreen] = useState('home');
  const [isOnboarded, setIsOnboarded] = useState(StorageService.isOnboarded());
  const [refreshKey, setRefreshKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [displayScreen, setDisplayScreen] = useState('home');

  const handleNavigate = (newScreen) => {
    if (newScreen === screen) return;
    setTransitioning(true);
    setTimeout(() => {
      setScreen(newScreen);
      setDisplayScreen(newScreen);
      setRefreshKey(k => k + 1);
      window.scrollTo(0, 0);
      setTimeout(() => setTransitioning(false), 20);
    }, 200);
  };

  const handleReset = () => {
    setIsOnboarded(false);
    setScreen('home');
    setDisplayScreen('home');
    setRefreshKey(k => k + 1);
  };

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    setScreen('home');
    setDisplayScreen('home');
    setRefreshKey(k => k + 1);
  };

  if (!isOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const screenContent = () => {
    switch (displayScreen) {
      case 'home': return <HomeScreen onNavigate={handleNavigate} />;
      case 'checkin': return <CheckInScreen onNavigate={handleNavigate} />;
      case 'milestones': return <MilestonesScreen onNavigate={handleNavigate} />;
      case 'badges': return <BadgesScreen onNavigate={handleNavigate} />;
      case 'journal': return <JournalScreen onNavigate={handleNavigate} />;
      case 'settings': return <SettingsScreen onNavigate={handleNavigate} onReset={handleReset} />;
      default: return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div>
      <div key={refreshKey} className={`screen-transition ${transitioning ? 'screen-exit' : 'screen-enter'}`}>
        {screenContent()}
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${screen === 'home' ? 'active' : ''}`} onClick={() => handleNavigate('home')}>
          <Home size={22} className="nav-icon-svg" />
          <span className="nav-label">Główna</span>
        </button>
        <button className={`nav-item ${screen === 'checkin' ? 'active' : ''}`} onClick={() => handleNavigate('checkin')}>
          <Notebook size={22} className="nav-icon-svg" />
          <span className="nav-label">Notatka</span>
        </button>
        <button className={`nav-item ${screen === 'journal' ? 'active' : ''}`} onClick={() => handleNavigate('journal')}>
          <BookOpen size={22} className="nav-icon-svg" />
          <span className="nav-label">Dziennik</span>
        </button>
        <button className={`nav-item ${screen === 'milestones' ? 'active' : ''}`} onClick={() => handleNavigate('milestones')}>
          <Heart size={22} className="nav-icon-svg" />
          <span className="nav-label">Zdrowie</span>
        </button>
        <button className={`nav-item ${screen === 'settings' ? 'active' : ''}`} onClick={() => handleNavigate('settings')}>
          <Settings size={22} className="nav-icon-svg" />
          <span className="nav-label">Więcej</span>
        </button>
      </nav>
    </div>
  );
}
