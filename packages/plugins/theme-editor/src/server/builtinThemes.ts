import { ThemeItem } from '../types';

/** antd 默认主题 */
export const antd: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Default theme of antd',
  },
  optional: false,
  isBuiltIn: true,
};

export const dark: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Dark',
    // @ts-ignore
    algorithm: 'darkAlgorithm',
  },
  optional: false,
  isBuiltIn: true,
};

export const compact: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Compact',
    // @ts-ignore
    algorithm: 'compactAlgorithm',
  },
  optional: false,
  isBuiltIn: true,
};

/** 同时包含 `紧凑` 和 `暗黑` 两种模式 */
export const compactDark: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'Compact dark',
    // @ts-ignore
    algorithm: ['compactAlgorithm', 'darkAlgorithm'],
  },
  optional: false,
  isBuiltIn: true,
};
