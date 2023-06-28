import type { ThemeConfig as Config } from 'antd';
import { theme } from 'antd';

type ThemeConfig = Config & { id: string };

export const defaultTheme: ThemeConfig = {
  id: 'default',
  algorithm: theme.defaultAlgorithm,
};

export const darkTheme: ThemeConfig = {
  id: 'dark',
  algorithm: theme.darkAlgorithm,
};

export const compactTheme: ThemeConfig = {
  id: 'compact',
  algorithm: theme.compactAlgorithm,
};
