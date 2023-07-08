import type { CSSInterpolation, CSSObject } from '@ant-design/cssinjs';
import { useStyleRegister } from '@ant-design/cssinjs';
import { merge } from '@formily/shared';
import type { ComponentTokenMap, GlobalToken } from 'antd/es/theme/interface';
import { useConfig, usePrefixCls, useToken } from './hooks';

export type OverrideComponent = keyof ComponentTokenMap | string;

export interface StyleInfo {
  hashId: string;
  prefixCls: string;
  rootPrefixCls: string;
  iconPrefixCls: string;
}

export type TokenWithCommonCls<T> = T & {
  /** Wrap component class with `.` prefix */
  componentCls: string;
  /** Origin prefix which do not have `.` prefix */
  prefixCls: string;
  /** Wrap icon class with `.` prefix */
  iconCls: string;
  /** Wrap ant prefixCls class with `.` prefix */
  antCls: string;
};

export type GenerateStyle<
  ComponentToken extends object = TokenWithCommonCls<GlobalToken>,
  ReturnType = CSSInterpolation,
> = (token: ComponentToken, options?: any) => ReturnType;

export const genCommonStyle = (token: any, componentPrefixCls: string): CSSObject => {
  const { fontFamily, fontSize } = token;

  const rootPrefixSelector = `[class^="${componentPrefixCls}"], [class*=" ${componentPrefixCls}"]`;

  return {
    [rootPrefixSelector]: {
      fontFamily,
      fontSize,
      boxSizing: 'border-box',

      '&::before, &::after': {
        boxSizing: 'border-box',
      },

      [rootPrefixSelector]: {
        boxSizing: 'border-box',

        '&::before, &::after': {
          boxSizing: 'border-box',
        },
      },
    },
  };
};
export type UseComponentStyleResult = {
  wrapSSR: ReturnType<typeof useStyleRegister>;
  hashId: string;
  componentCls: string;
};

export const genStyleHook = <ComponentName extends OverrideComponent>(
  component: ComponentName,
  styleFn: (token: TokenWithCommonCls<GlobalToken>, props: any, info: StyleInfo) => CSSInterpolation,
) => {
  return (props?: any): UseComponentStyleResult => {
    const { theme, token, hashId } = useToken();
    const { getPrefixCls, iconPrefixCls } = useConfig();
    const prefixCls = usePrefixCls(component);
    const rootPrefixCls = getPrefixCls();

    return {
      wrapSSR: useStyleRegister(
        {
          theme,
          token,
          hashId,
          path: ['formily-antd', component, prefixCls, iconPrefixCls],
        },
        () => {
          const componentCls = `.${prefixCls}`;
          const mergedToken: TokenWithCommonCls<GlobalToken> = merge(token, {
            componentCls,
            prefixCls,
            iconCls: `.${iconPrefixCls}`,
            antCls: `.${rootPrefixCls}`,
          });

          const styleInterpolation = styleFn(mergedToken, props, {
            hashId,
            prefixCls,
            rootPrefixCls,
            iconPrefixCls,
          });
          return [genCommonStyle(token, prefixCls), styleInterpolation];
        },
      ),
      hashId,
      componentCls: prefixCls,
    };
  };
};
