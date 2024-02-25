import type { ThemeConfig } from '@nocobase/client';
import type { ReactElement } from 'react';

export type Theme = {
  name: string;
  key: string;
  config: ThemeConfig;
};

export type AliasToken = Exclude<ThemeConfig['token'], undefined>;
export type TokenValue = string | number | string[] | number[] | boolean;
export type TokenName = keyof AliasToken;

export interface ComponentDemo {
  tokens?: TokenName[];
  demo: ReactElement;
  key: string;
}

export interface MutableTheme extends Theme {
  onThemeChange?: (newTheme: ThemeConfig, path: string[]) => void;
  onReset?: (path: string[]) => void;
  getCanReset?: (path: string[]) => boolean;
}

export type PreviewerProps = {
  onSave?: (themeConfig: ThemeConfig) => void;
  showTheme?: boolean;
  theme?: Theme;
  onThemeChange?: (config: ThemeConfig) => void;
};

export type SelectedToken = {
  seed?: string[];
  map?: string[];
  alias?: string[];
};
