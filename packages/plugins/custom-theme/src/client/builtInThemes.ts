import { theme } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from './locale';
import { ThemeConfig } from './types';

export const useBuiltInThemes = (): ThemeConfig[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    return [
      {
        name: t('Default theme'),
        algorithm: theme.defaultAlgorithm,
      },
      {
        name: t('Dark theme'),
        algorithm: theme.darkAlgorithm,
      },
      {
        name: t('Compact theme'),
        algorithm: theme.compactAlgorithm,
      },
    ];
  }, []);
};
