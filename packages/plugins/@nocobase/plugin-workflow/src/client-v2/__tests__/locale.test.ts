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

describe('plugin-workflow client-v2 locale entries', () => {
  it('provides the invalid workflow warning in English and Chinese', () => {
    expect(enUS).toMatchObject({
      'This workflow has configuration issues and may not work properly.':
        'This workflow has configuration issues and may not work properly.',
    });
    expect(zhCN).toMatchObject({
      'This workflow has configuration issues and may not work properly.': '该工作流配置存在问题，可能无法正常使用',
    });
  });
});
