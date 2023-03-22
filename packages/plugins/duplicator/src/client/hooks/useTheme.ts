import { useCurrentAppInfo } from '@nocobase/client';

export const useTheme = () => {
  const {
    data: { theme },
  } = useCurrentAppInfo() || { data: { theme: 'default' } };

  return theme;
};
