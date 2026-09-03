import { useState, useEffect, useCallback } from 'react';

/**
 * useTimer — live countdown/up from a given date
 * Returns days, hours, minutes, seconds elapsed
 */
export function useTimer(quitDate) {
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    if (!quitDate) return;

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, now - new Date(quitDate).getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed({ days, hours, minutes, seconds, totalMs: diff });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [quitDate]);

  return elapsed;
}

/**
 * useBreathing — controls a 4-7-8 breathing exercise
 */
export function useBreathing() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, inhale, hold, exhale, done
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(0);

  const TOTAL_CYCLES = 3;
  const INHALE_TIME = 4;
  const HOLD_TIME = 7;
  const EXHALE_TIME = 8;

  const start = useCallback(() => {
    setActive(true);
    setPhase('inhale');
    setTimeLeft(INHALE_TIME);
    setCycle(1);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setPhase('idle');
    setTimeLeft(0);
    setCycle(0);
  }, []);

  useEffect(() => {
    if (!active || phase === 'idle' || phase === 'done') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return HOLD_TIME;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return EXHALE_TIME;
          } else if (phase === 'exhale') {
            if (cycle >= TOTAL_CYCLES) {
              setPhase('done');
              setActive(false);
              return 0;
            }
            setCycle(c => c + 1);
            setPhase('inhale');
            return INHALE_TIME;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, phase, cycle]);

  const phaseLabel = {
    idle: '',
    inhale: 'Wciągaj',
    hold: 'Trzymaj',
    exhale: 'Wypuszczaj',
    done: 'Gotowe!',
  };

  return { active, phase, timeLeft, cycle, totalCycles: TOTAL_CYCLES, start, stop, phaseLabel: phaseLabel[phase] };
}

/**
 * useToast — toast notifications
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast: show };
}
