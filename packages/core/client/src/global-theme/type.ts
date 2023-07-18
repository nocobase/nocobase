import { MappingAlgorithm } from 'antd/es/config-provider/context';
import { OverrideToken } from 'antd/es/theme/interface';
import { AliasToken } from 'antd/es/theme/internal';

export interface CustomToken extends AliasToken {
  /** 顶部导航栏主色 */
  colorPrimaryHeader: string;
  /** 导航栏背景色 */
  colorBgHeader: string;
  /** 导航栏菜单背景色悬浮态 */
  colorBgHeaderMenuHover: string;
  /** 导航栏菜单背景色激活态 */
  colorBgHeaderMenuActive: string;
  /** 导航栏菜单文本色 */
  colorTextHeaderMenu: string;
  /** UI 配置主色 */
  colorPrimarySettings: string;
  /** UI 配置背景色 */
  colorBgSettings: string;
  /** UI 配置边框色 */
  colorBorderSettings: string;
  /** UI 配置文本色 */
  colorTextSettings: string;
}

export interface ThemeConfig {
  name?: string;
  token?: Partial<CustomToken>;
  components?: OverrideToken;
  algorithm?: MappingAlgorithm | MappingAlgorithm[];
  hashed?: boolean;
  inherit?: boolean;
}
