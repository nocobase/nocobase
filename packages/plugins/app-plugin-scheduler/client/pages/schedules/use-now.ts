import { useEffect, useState } from 'react';

/** The current time, refreshed every `interval` milliseconds, so relative times and long waits stay current. */
export function useNow(interval = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}
