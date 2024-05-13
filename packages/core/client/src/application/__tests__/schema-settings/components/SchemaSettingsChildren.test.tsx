/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { screen, userEvent } from '@nocobase/test/client';
import { SchemaInitializerItem, useSchemaSettingsItem } from '@nocobase/client';

import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaSettingsChildren', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        componentProps: {
          title: 'Item1',
        },
      },
      {
        name: 'item2',
        type: 'item',
        componentProps: {
          title: 'Item2',
        },
      },
    ]);

    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-dropdown-menu').textContent).toBe('Item1Item2');
  });

  it('sort', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        componentProps: {
          title: 'Item1',
        },
        sort: 2,
      },
      {
        name: 'item2',
        type: 'item',
        componentProps: {
          title: 'Item2',
        },
        sort: 1,
      },
    ]);

    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-dropdown-menu').textContent).toBe('Item2Item1');
  });

  it('Component', async () => {
    await createAndHover(
      [
        {
          name: 'item1',
          componentProps: {
            title: 'Item1',
          },
          Component: () => {
            return <div>Item1</div>;
          },
        },
        {
          name: 'item2',
          Component: 'Item2',
        },
        {
          name: 'item3',
          Component: 'not-exists',
        },
        {
          name: 'item4',
        } as any,
      ],
      {
        components: {
          Item2: () => {
            return <div>Item2</div>;
          },
        },
      },
    );
    expect(screen.queryByText('Item1')).toBeInTheDocument();
    expect(screen.queryByText('Item2')).toBeInTheDocument();
  });

  it('useVisible()', async () => {
    await createAndHover([
      {
        name: 'item1',
        type: 'item',
        componentProps: {
          title: 'Item1',
        },
        useVisible() {
          return true;
        },
      },
      {
        name: 'item2',
        type: 'item',
        componentProps: {
          title: 'Item2',
        },
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
        componentProps: {
          title: 'A',
        },
        children: [
          {
            name: 'item1',
            type: 'item',
            componentProps: {
              title: 'Item1',
            },
          },
          {
            name: 'item2',
            type: 'item',
            componentProps: {
              title: 'Item2',
            },
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
        componentProps: {
          title: 'A',
        },
        useChildren() {
          return [
            {
              name: 'item1',
              type: 'item',
              componentProps: {
                title: 'Item1',
              },
            },
            {
              name: 'item2',
              type: 'item',
              componentProps: {
                title: 'Item2',
              },
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
        componentProps: {
          title: 'A',
        },
        useChildren() {
          return [
            {
              name: 'item1',
              type: 'item',
              componentProps: {
                title: 'Item1',
              },
            },
            {
              name: 'item2',
              type: 'item',
              componentProps: {
                title: 'Item2',
              },
            },
          ];
        },
        children: [
          {
            name: 'item3',
            type: 'item',
            componentProps: {
              title: 'Item3',
            },
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
        componentProps: {
          title: 'A',
        },
        hideIfNoChildren: true,
        children: [],
      },
      {
        name: 'b',
        type: 'itemGroup',
        componentProps: {
          title: 'B',
        },
        hideIfNoChildren: true,
      },
      {
        name: 'c',
        type: 'itemGroup',
        componentProps: {
          title: 'C',
        },
        hideIfNoChildren: true,
        useChildren() {
          return undefined;
        },
      },
      {
        name: 'd',
        type: 'itemGroup',
        componentProps: {
          title: 'D',
        },
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
        } as any,
      ],
      {
        components: {
          CommonDemo: () => {
            const { title } = useSchemaSettingsItem<any>();
            return <SchemaInitializerItem title={title} />;
          },
        },
      },
    );

    expect(screen.queryByText('Item1')).toBeInTheDocument();
  });
});
