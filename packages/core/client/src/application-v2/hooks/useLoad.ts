import { useEffect, useState } from 'react';
import { useApp } from './useApp';

export const useLoad = () => {
  const app = useApp();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    (async () => {
      await app.load();
      setLoading(false);
    })();
  }, []);
  return loading;
};
