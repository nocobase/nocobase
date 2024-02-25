import type { ThemeConfig as Config } from '@nocobase/client';
import type { ReactElement } from 'react';
export type ThemeConfig = Config;

export interface ThemeItem {
  id: number;
  /** 主题配置内容，一个 JSON 字符串 */
  config: ThemeConfig | null;
  /** 主题是否可选 */
  optional: boolean;
  isBuiltIn?: boolean;
  uid?: string;
  default?: boolean; // 当前系统默认主题
}

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
  onAbort?: (path: string[]) => void;
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
