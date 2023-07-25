import defaultTheme from './defaultTheme';
import { ThemeConfig } from './type';

// 兼容旧主题
function compatOldTheme(theme: ThemeConfig) {
  if (!theme.token?.colorSettings) {
    theme.token = { ...theme.token, ...defaultTheme.token };
  }

  return theme;
}

export default compatOldTheme;
