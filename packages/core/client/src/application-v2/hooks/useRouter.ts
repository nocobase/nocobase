import { useApp } from './useApp';

export const useRouter = () => {
  const app = useApp();
  return app.router;
};
