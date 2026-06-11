/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { render, renderAppOptions, screen, waitFor } from '@nocobase/test/client';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import App1 from '../demos/demo1';

describe('FormItem', () => {
  it('should render correctly', async () => {
    render(
      <MemoryRouter>
        <App1 />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('should scope the horizontal collection field control override to grid columns', async () => {
    const CollectionField = () => {
      const schema = useFieldSchema();
      return <input data-testid="collection-field" data-component={schema['x-component'] as string} />;
    };

    await renderAppOptions({
      enableUserListDataBlock: true,
      appOptions: {
        components: {
          CollectionField,
        },
      },
      schema: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          layout: 'horizontal',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            properties: {
              row: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      nickname: {
                        type: 'string',
                        title: 'Nickname',
                        'x-decorator': 'FormItem',
                        'x-component': 'CollectionField',
                        'x-collection-field': 'users.nickname',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Nickname')).toBeInTheDocument();
    });

    expect(document.querySelector('.nb-grid-container')).toBeInTheDocument();
    expect(document.querySelector('.ant-formily-item')).toHaveClass('ant-formily-item-layout-horizontal');
    expect(screen.getByTestId('collection-field')).toHaveAttribute('data-component', 'CollectionField');
    expect(
      Array.from(document.querySelectorAll('style'))
        .map((style) => style.textContent)
        .join('\n'),
    ).toContain('.nb-grid-col');
  });
});
