/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { CollectionDeletedPlaceholder, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { App } from 'antd';

function renderAppOptions(name?: any, designable?: boolean) {
  const schema = {
    name: 'root',
    type: 'void',
    'x-component': 'CollectionDeletedPlaceholder',
    'x-component-props': {
      name,
      type: 'Collection',
    },
  };

  render(
    <div data-testid="app">
      <App>
        <SchemaComponentProvider designable={designable}>
          <SchemaComponent schema={schema} components={{ CollectionDeletedPlaceholder }} />
        </SchemaComponentProvider>
      </App>
    </div>,
  );
}

describe('CollectionDeletedPlaceholder', () => {
  test('name is undefined, render `Result` component', async () => {
    renderAppOptions(undefined, true);

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Collection name is required')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to delete it?')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  test('designable: true, render `Result` component', () => {
    renderAppOptions('test', true);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(
      screen.getByText('The collection "test" may have been deleted. Please remove this block.'),
    ).toBeInTheDocument();
  });

  test('designable: false, render nothing', () => {
    renderAppOptions('test', false);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
