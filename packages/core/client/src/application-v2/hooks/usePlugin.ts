import { useApp } from './useApp';

export const usePlugin = <T>(name: string): T => {
  const app = useApp();
  return app.pm.get<T>(name);
};
