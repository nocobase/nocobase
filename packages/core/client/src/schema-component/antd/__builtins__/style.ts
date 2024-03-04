import type { CSSInterpolation, CSSObject } from '@ant-design/cssinjs';
import { useStyleRegister } from '@ant-design/cssinjs';
import { merge } from '@formily/shared';
import type { ComponentTokenMap, GlobalToken } from 'antd/es/theme/interface';
import { CustomToken } from '../../../global-theme';
import { useConfig, usePrefixCls, useToken } from './hooks';
import { useMemo } from 'react';

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
  rootPrefixCls: string;
};

export const genStyleHook = <ComponentName extends OverrideComponent>(
  component: ComponentName,
  styleFn: (token: TokenWithCommonCls<CustomToken>, props: any, info: StyleInfo) => CSSInterpolation,
) => {
  return (props?: any): UseComponentStyleResult => {
    const { theme, token, hashId } = useToken();
    const { getPrefixCls, iconPrefixCls } = useConfig();
    const prefixCls = usePrefixCls(component);
    const rootPrefixCls = getPrefixCls();

    const wrapSSR = useStyleRegister(
      {
        theme: theme as any,
        token,
        hashId,
        path: ['formily-antd', component, prefixCls, iconPrefixCls],
      },
      () => {
        const componentCls = `.${prefixCls}`;
        const mergedToken: TokenWithCommonCls<CustomToken> = merge(token, {
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
    );

    // useStyleRegister 有 BUG，会导致重复渲染，所以这里做了一层缓存
    // 等 https://github.com/ant-design/cssinjs/pull/176 合并后，可以去掉这层缓存
    const memoizedWrapSSR = useMemo(() => {
      return wrapSSR;
    }, [theme, token, hashId, prefixCls, iconPrefixCls, rootPrefixCls, props]);

    return {
      wrapSSR: memoizedWrapSSR,
      hashId,
      componentCls: prefixCls,
      rootPrefixCls,
    };
  };
};
