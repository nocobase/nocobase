/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent } from '@nocobase/test/client';

import { SchemaInitializerItem, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerChildren', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        title: 'Item1',
      },
      {
        name: 'item2',
        type: 'item',
        title: 'Item2',
      },
    ]);

    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-popover-content').textContent).toBe('Item1Item2');
  });

  it('sort', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        title: 'Item1',
        sort: 2,
      },
      {
        name: 'item2',
        type: 'item',
        title: 'Item2',
        sort: 1,
      },
    ]);

    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-popover-content').textContent).toBe('Item2Item1');
  });

  it('component', async () => {
    await createAndHover(
      [
        {
          name: 'item1',
          type: 'item',
          title: 'Item1',
          // 小写
          component: () => {
            return <div>Item1</div>;
          },
        },
        {
          name: 'item2',
          type: 'item',
          title: 'Item2',
          // 大写
          Component: () => {
            return <div>Item2</div>;
          },
        },
        {
          name: 'item3',
          Component: 'Item3',
        },
        {
          name: 'item4',
          Component: 'not-exists',
        },
      ],
      {
        components: {
          Item3: () => {
            return <div>Item3</div>;
          },
        },
      },
    );
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(screen.queryByText('Item3')).toBeInTheDocument();
  });

  it('useVisible()', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        title: 'Item1',
        useVisible() {
          return true;
        },
      },
      {
        name: 'item2',
        type: 'item',
        title: 'Item2',
        useVisible() {
          return false;
        },
      },
    ]);

    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).not.toBeInTheDocument();
  });

  it('children', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'itemGroup',
        title: 'A',
        children: [
          {
            name: 'item1',
            type: 'item',
            title: 'Item1',
          },
          {
            name: 'item2',
            type: 'item',
            title: 'Item2',
          },
        ],
      },
    ]);

    expect(screen.queryByText('A')).toBeInTheDocument();
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
  });

  it('useChildren()', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'itemGroup',
        title: 'A',
        useChildren() {
          return [
            {
              name: 'item1',
              type: 'item',
              title: 'Item1',
            },
            {
              name: 'item2',
              type: 'item',
              title: 'Item2',
            },
          ];
        },
      },
    ]);

    expect(screen.queryByText('A')).toBeInTheDocument();
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
  });

  it('should merge `children` and `useChildren()`', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'itemGroup',
        title: 'A',
        useChildren() {
          return [
            {
              name: 'item1',
              type: 'item',
              title: 'Item1',
            },
            {
              name: 'item2',
              type: 'item',
              title: 'Item2',
            },
          ];
        },
        children: [
          {
            name: 'item3',
            type: 'item',
            title: 'Item3',
          },
        ],
      },
    ]);

    expect(screen.queryByText('A')).toBeInTheDocument();
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(screen.queryByText('Item3')).toBeInTheDocument();
  });

  it('hideIfNoChildren', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'itemGroup',
        title: 'A',
        hideIfNoChildren: true,
        children: [],
      },
      {
        name: 'b',
        type: 'itemGroup',
        title: 'B',
        hideIfNoChildren: true,
      },
      {
        name: 'c',
        type: 'itemGroup',
        title: 'C',
        hideIfNoChildren: true,
        useChildren() {
          return undefined;
        },
      },
      {
        name: 'd',
        type: 'itemGroup',
        title: 'D',
        hideIfNoChildren: true,
        useChildren() {
          return [];
        },
      },
    ]);

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('B')).not.toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('componentProps', async () => {
    await createAndHover(
      [
        {
          name: 'item1',
          Component: 'CommonDemo',
          componentProps: {
            title: 'Item1',
          },
        },
      ],
      {
        components: {
          CommonDemo: (props) => {
            return <SchemaInitializerItem title={props.title} />;
          },
        },
      },
    );

    expect(screen.queryByText('Item1')).toBeInTheDocument();
  });

  it('useComponentProps', async () => {
    await createAndHover(
      [
        {
          name: 'item1',
          Component: 'CommonDemo',
          useComponentProps() {
            return {
              title: 'Item1',
            };
          },
        },
      ],
      {
        components: {
          CommonDemo: (props) => {
            return <SchemaInitializerItem title={props.title} />;
          },
        },
      },
    );

    expect(screen.queryByText('Item1')).toBeInTheDocument();
  });

  it('should merge `componentProps` and `useComponentProps()`', async () => {
    const onClick = vitest.fn();
    await createAndHover(
      [
        {
          name: 'item1',
          Component: 'CommonDemo',
          componentProps: {
            title: 'Item1',
          },
          useComponentProps() {
            return {
              onClick,
            };
          },
        },
      ],
      {
        components: {
          CommonDemo: (props) => {
            return <SchemaInitializerItem title={props.title} onClick={props.onClick} />;
          },
        },
      },
    );

    expect(screen.queryByText('Item1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Item1'));
    expect(onClick).toBeCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({
          title: 'Item1',
        }),
      }),
    );
  });

  it('public props', async () => {
    await createAndHover(
      [
        {
          name: 'item1',
          Component: 'CommonDemo',
          title: 'Item1',
        },
      ],
      {
        components: {
          CommonDemo: () => {
            const { title } = useSchemaInitializerItem();
            return <SchemaInitializerItem title={title} />;
          },
        },
      },
    );

    expect(screen.queryByText('Item1')).toBeInTheDocument();
  });
});
