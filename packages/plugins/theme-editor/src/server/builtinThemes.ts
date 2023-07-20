import { ThemeItem } from '../types';

/** antd 默认主题 */
export const antd: Omit<ThemeItem, 'id'> = {
  config: {
    name: 'antd 默认主题',
  },
  optional: false,
  isBuiltIn: true,
};

export const dark: Omit<ThemeItem, 'id'> = {
  config: {
    name: '暗黑',
    // @ts-ignore
    algorithm: 'darkAlgorithm',
  },
  optional: false,
  isBuiltIn: true,
};

export const compact: Omit<ThemeItem, 'id'> = {
  config: {
    name: '紧凑',
    // @ts-ignore
    algorithm: 'compactAlgorithm',
  },
  optional: false,
  isBuiltIn: true,
};

/** 同时包含 `紧凑` 和 `暗黑` 两种模式 */
export const compactDark: Omit<ThemeItem, 'id'> = {
  config: {
    name: '紧凑暗黑',
    // @ts-ignore
    algorithm: ['compactAlgorithm', 'darkAlgorithm'],
  },
  optional: false,
  isBuiltIn: true,
};
