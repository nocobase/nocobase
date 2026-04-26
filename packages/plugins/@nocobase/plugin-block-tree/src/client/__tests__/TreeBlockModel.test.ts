/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TreeBlockModel } from '../models/TreeBlockModel';

describe('TreeBlockModel', () => {
  test('tree settings expose default sorting through the common sorting rule flow', () => {
    const flow: any = (TreeBlockModel as any).globalFlowRegistry.getFlow('treeSettings');

    expect(flow.steps.defaultSorting).toMatchObject({
      use: 'sortingRule',
    });
    expect(flow.steps.defaultSorting.title).toContain('Default sorting');
  });
});
