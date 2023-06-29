import type { ThemeConfig as Config } from 'antd';

export type ThemeConfig = Config & { name: string };

export interface ThemeItem {
  id: number;
  /** 主题配置内容，一个 JSON 字符串 */
  config: ThemeConfig;
  /** 主题是否可选 */
  optional: boolean;
  isBuiltIn?: boolean;
}
