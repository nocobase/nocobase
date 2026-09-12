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

describe('workflow-manual v2 task locale', () => {
  it('contains the legacy-page notice in English and Chinese', () => {
    expect(enUS).toMatchObject({
      'Manual task cannot be processed on the new page': 'Manual task cannot be processed on the new page',
      'Manual tasks are not yet supported on the new page. Return to the legacy page to process this task.':
        'Manual tasks are not yet supported on the new page. Return to the legacy page to process this task.',
      'Return to legacy page': 'Return to legacy page',
    });
    expect(zhCN).toMatchObject({
      'Manual task cannot be processed on the new page': '人工任务无法在新版页面中处理',
      'Manual tasks are not yet supported on the new page. Return to the legacy page to process this task.':
        '新版页面暂不支持处理人工任务，请返回旧版页面处理该任务。',
      'Return to legacy page': '返回旧版页面',
    });
  });
});
