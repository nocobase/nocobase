/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen } from '@nocobase/test/client';

import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerDivider', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'item',
        title: 'A',
      },
      {
        type: 'divider',
        name: 'divider1',
      },
      {
        name: 'b',
        type: 'item',
        title: 'B',
      },
    ]);

    expect(screen.queryByText('A')).toBeInTheDocument();
    expect(screen.queryByText('B')).toBeInTheDocument();
    expect(document.querySelector('.ant-divider')).toBeInTheDocument();
  });
});
