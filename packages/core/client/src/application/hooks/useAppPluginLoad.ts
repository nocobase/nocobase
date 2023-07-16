import { useEffect, useState } from 'react';
import type { Application } from '../Application';

export function useAppPluginLoad(app: Application) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    async function run() {
      try {
        await app.load();
      } catch (err) {
        console.error(err);
        setError(err);
      }
      setLoading(false);
    }
    run();
  }, [app]);
  return { loading, error };
}
