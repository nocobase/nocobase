/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useStyleRegister } from '@ant-design/cssinjs';
import { theme as antdTheme } from 'antd';

export const genStyleHook = (component: string, styleFn: (token: any, props?: any, info?: any) => any) => {
  return (props?: any) => {
    const { theme, token, hashId } = antdTheme.useToken();
    const prefixCls = component;
    const rootPrefixCls = 'ant';
    const iconPrefixCls = 'anticon';

    const wrapSSR = useStyleRegister(
      {
        theme: theme as any,
        token,
        hashId,
        path: ['nocobase-plugin-calendar-v2', component],
      },
      () => {
        const componentCls = `.${prefixCls}`;
        return styleFn(
          {
            ...token,
            componentCls,
            prefixCls,
            iconCls: `.${iconPrefixCls}`,
            antCls: `.${rootPrefixCls}`,
          },
          props,
          {
            hashId,
            prefixCls,
            rootPrefixCls,
            iconPrefixCls,
          },
        );
      },
    );

    return {
      wrapSSR,
      hashId,
      componentCls: prefixCls,
      rootPrefixCls,
    };
  };
};
