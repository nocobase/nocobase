/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
