/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider } from 'antd';
import React, { FC } from 'react';
import { useGlobalTheme } from '../../../global-theme';

/**
 * 重置主题，避免被 ProLayout 的主题影响，同时保留当前算法配置。
 */
export const ResetThemeTokenAndKeepAlgorithm: FC<any> = (props) => {
  const { theme } = useGlobalTheme();

  return (
    <ConfigProvider
      theme={{
        ...theme,
        inherit: false,
      }}
    >
      {props.children}
    </ConfigProvider>
  );
};
