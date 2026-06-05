/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CSSInterpolation, CSSObject } from '@ant-design/cssinjs';
import { useStyleRegister } from '@ant-design/cssinjs';
import { merge } from '@formily/shared';
import type { ComponentTokenMap } from 'antd/es/theme/interface';
import { useMemo, useContext } from 'react';
import { ConfigProvider, theme } from 'antd';

const usePrefixCls = (
  tag?: string,
  props?: {
    prefixCls?: string;
  },
) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext) || {};
  if ('ConfigContext' in ConfigProvider) {
    return getPrefixCls?.(tag, props?.prefixCls) || '';
  } else {
    const prefix = props?.prefixCls ?? 'ant-';
    return `${prefix}${tag ?? ''}`;
  }
};
const { ConfigContext } = ConfigProvider;
const useConfig = () => useContext(ConfigContext);
const useToken = theme.useToken;

type OverrideComponent = keyof ComponentTokenMap | string;

interface StyleInfo {
  hashId: string;
  prefixCls: string;
  rootPrefixCls: string;
  iconPrefixCls: string;
}

type TokenWithCommonCls<T> = T & {
  /** Wrap component class with `.` prefix */
  componentCls: string;
  /** Origin prefix which do not have `.` prefix */
  prefixCls: string;
  /** Wrap icon class with `.` prefix */
  iconCls: string;
  /** Wrap ant prefixCls class with `.` prefix */
  antCls: string;
};

const genCommonStyle = (token: any, componentPrefixCls: string): CSSObject => {
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
type UseComponentStyleResult = {
  wrapSSR: ReturnType<typeof useStyleRegister>;
  hashId: string;
  componentCls: string;
  rootPrefixCls: string;
};

const genStyleHook = <ComponentName extends OverrideComponent>(
  component: ComponentName,
  styleFn: (token: TokenWithCommonCls<any>, props: any, info: StyleInfo) => CSSInterpolation,
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
        const mergedToken: TokenWithCommonCls<any> = merge(token, {
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

export const useMobileActionDrawerStyle = genStyleHook('nb-mobile-action-drawer', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.nb-mobile-action-drawer-header': {
        height: 'var(--nb-mobile-page-header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${token.colorSplit}`,
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1000,

        // to match the button named 'Add block'
        '& + .nb-grid-container > .nb-grid > .nb-grid-warp > .ant-btn': {
          margin: 12,
        },
      },

      '.nb-mobile-action-drawer-placeholder': {
        display: 'inline-block',
        padding: 12,
        visibility: 'hidden',
      },

      '.nb-mobile-action-drawer-close-icon': {
        display: 'inline-block',
        padding: 12,
        cursor: 'pointer',
      },

      '.nb-mobile-action-drawer-body': {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: token.colorBgLayout,

        // 不带 tab 页的半窗
        '& > .nb-grid-container': {
          padding: `${token.paddingPageVertical}px ${token.paddingPageHorizontal}px`,
        },

        // 带有 tab 页的半窗
        '.ant-tabs-nav': {
          marginBottom: '0px !important',
          padding: `0 ${token.paddingPageHorizontal + token.borderRadiusBlock / 2}px`,
          backgroundColor: token.colorBgContainer,
        },

        // clear the margin-bottom of the last block
        '& > .nb-grid-container > .nb-grid > .nb-grid-warp > .nb-grid-row:nth-last-child(2) .noco-card-item': {
          marginBottom: 0,

          '& > .ant-card': {
            marginBottom: '0 !important',
          },
        },
      },

      '.nb-mobile-action-drawer-footer': {
        padding: '8px var(--nb-mobile-page-tabs-content-padding)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: `1px solid ${token.colorSplit}`,
        backgroundColor: token.colorBgLayout,

        '.ant-btn': {
          marginLeft: 8,
        },
      },
    },
  };
});
