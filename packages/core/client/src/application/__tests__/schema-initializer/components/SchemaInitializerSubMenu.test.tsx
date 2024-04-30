/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent, waitFor } from '@nocobase/test/client';

import { SchemaInitializerSubMenu } from '@nocobase/client';
import React from 'react';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerSubMenu', () => {
  async function valid(onClick) {
    expect(screen.getByText('A Title')).toBeInTheDocument();

    await userEvent.hover(screen.getByText('A Title'));

    await waitFor(() => {
      expect(screen.queryByText('A1')).toBeInTheDocument();
      expect(screen.queryByText('A2')).not.toBeInTheDocument();
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('A1'));

    await waitFor(() => {
      expect(onClick).toBeCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({
            name: 'a1',
          }),
        }),
      );
    });
  }

  test('basic', async () => {
    const onClick = vitest.fn();
    await createAndHover([
      {
        name: 'a',
        title: 'A Title',
        type: 'subMenu',
        children: [
          {
            name: 'a1',
            type: 'item',
            title: 'A1',
            icon: 'ApiOutlined',
            onClick: onClick,
          },
          {
            name: 'a2',
            type: 'item',
            title: 'A2',
            useVisible() {
              return false;
            },
          },
        ],
      },
    ]);

    await valid(onClick);
  });

  test('component mode', async () => {
    const onClick = vitest.fn();
    const TestDemo = () => {
      return (
        <SchemaInitializerSubMenu
          name="a"
          title="A Title"
          items={[
            {
              name: 'a1',
              type: 'item',
              title: 'A1',
              onClick: onClick,
              useVisible() {
                return true;
              },
            },
            {
              name: 'a2',
              type: 'item',
              title: 'A2',
              useVisible() {
                return false;
              },
            },
          ]}
        ></SchemaInitializerSubMenu>
      );
    };
    await createAndHover(
      [
        {
          name: 'a',
          Component: 'TestDemo',
        },
      ],
      {
        components: {
          TestDemo,
        },
      },
    );

    await valid(onClick);
  });
  test('component children mode', async () => {
    const onClick = vitest.fn();
    const TestDemo = () => {
      return (
        <SchemaInitializerSubMenu name="a" title="A Title">
          {[
            {
              name: 'a1',
              type: 'item',
              title: 'A1',
              onClick: onClick,
              useVisible() {
                return true;
              },
            },
            {
              name: 'a2',
              type: 'item',
              title: 'A2',
              useVisible() {
                return false;
              },
            },
          ]}
        </SchemaInitializerSubMenu>
      );
    };
    await createAndHover(
      [
        {
          name: 'a',
          Component: 'TestDemo',
        },
      ],
      {
        components: {
          TestDemo,
        },
      },
    );
    await valid(onClick);
  });
});
