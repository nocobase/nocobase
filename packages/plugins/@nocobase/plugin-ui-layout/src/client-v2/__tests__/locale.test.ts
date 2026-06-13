/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';

describe('plugin-ui-layout client-v2 locale entries', () => {
  it('should provide route management and permission locale entries', () => {
    expect(enUS).toMatchObject({
      'Modern page (v2)': 'Modern page (v2)',
      'Failed to load routes': 'Failed to load routes',
      'No matching routes': 'No matching routes',
      'No routes': 'No routes',
    });
    expect(zhCN).toMatchObject({
      'Modern page (v2)': '现代页面（v2）',
      'Failed to load routes': '路由加载失败',
      'No matching routes': '没有匹配的路由',
      'No routes': '暂无路由',
    });
  });
});
