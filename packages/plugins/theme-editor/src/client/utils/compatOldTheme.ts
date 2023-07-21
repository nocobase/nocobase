import { ThemeConfig, defaultTheme } from '@nocobase/client';

// 兼容旧主题
function compatOldTheme(theme: ThemeConfig) {
  if (!theme.token.colorSettings) {
    theme.token = { ...theme.token, ...defaultTheme.token };
  }

  return theme;
}

export default compatOldTheme;
