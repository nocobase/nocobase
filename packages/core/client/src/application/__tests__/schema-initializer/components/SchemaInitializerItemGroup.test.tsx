/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen } from '@nocobase/test/client';

import { SchemaInitializerItemGroup } from '@nocobase/client';
import React from 'react';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerItemGroup', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'a',
        title: 'A Group Title',
        type: 'itemGroup',
        children: [
          {
            name: 'a1',
            type: 'item',
            title: 'A1',
          },
        ],
      },
      {
        name: 'b',
        title: 'B Group Title',
        type: 'itemGroup',
        divider: true,
        useChildren() {
          return [
            {
              name: 'b1',
              type: 'item',
              title: 'B1',
            },
          ];
        },
      },
      {
        name: 'c',
        Component: () => {
          return (
            <SchemaInitializerItemGroup title="C Group Title" divider>
              {[
                {
                  name: 'c1',
                  type: 'item',
                  title: 'C1',
                },
              ]}
            </SchemaInitializerItemGroup>
          );
        },
      },
      {
        name: 'd',
        Component: () => {
          return (
            <SchemaInitializerItemGroup
              title="D Group Title"
              divider
              items={[
                {
                  name: 'd1',
                  type: 'item',
                  title: 'D1',
                },
              ]}
            ></SchemaInitializerItemGroup>
          );
        },
      },
    ]);
    expect(screen.queryByText('A Group Title')).toBeInTheDocument();
    expect(screen.queryByText('A1')).toBeInTheDocument();
    expect(screen.queryByText('B Group Title')).toBeInTheDocument();
    expect(screen.queryByText('B1')).toBeInTheDocument();
    expect(screen.queryByText('C Group Title')).toBeInTheDocument();
    expect(screen.queryByText('C1')).toBeInTheDocument();
    expect(screen.queryByText('D Group Title')).toBeInTheDocument();
    expect(screen.queryByText('D1')).toBeInTheDocument();

    expect(document.querySelectorAll('.ant-divider')).toHaveLength(3);
  });
});
