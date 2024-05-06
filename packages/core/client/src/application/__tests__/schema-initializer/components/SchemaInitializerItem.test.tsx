/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent, sleep, act } from '@nocobase/test/client';

import { SchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerItem', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        title: 'Item1',
      },
      {
        name: 'item2',
        Component: () => {
          return <SchemaInitializerItem title="Item2" />;
        },
      },
      {
        name: 'item3',
        icon: 'ApiOutlined',
        title: 'Item3',
        type: 'item',
      },
    ]);
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(screen.queryByText('Item3')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('items', async () => {
    const fn = vitest.fn();
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        title: 'Item1',
        onClick: fn,
        items: [
          {
            label: 'aaa',
            value: 'aaa',
          },
          {
            label: 'bbb',
            value: 'bbb',
            icon: 'ApiOutlined',
          },
        ],
      },
    ]);

    const user = userEvent.setup();
    await act(async () => {
      await user.hover(screen.getByText('Item1'));
      await sleep(300);
    });

    expect(screen.queryByText('aaa')).toBeInTheDocument();
    expect(screen.queryByText('bbb')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText('aaa'));
      await sleep(100);
    });

    expect(fn).toBeCalledWith(
      expect.objectContaining({
        item: {
          label: 'aaa',
          value: 'aaa',
        },
      }),
    );
  });
});
