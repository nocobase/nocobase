import { useTheme } from './useTheme';

export const useTableHeight = (): string => {
  const theme = useTheme();

  const map = {
    default: 'calc(100vh - 440px)',
    compact: 'calc(100vh - 328px)',
  };

  return map[theme];
};
