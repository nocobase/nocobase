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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return loading;
};
