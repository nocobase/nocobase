/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';
import BasicApp from '../demos/MobileTabBar.Page-basic';
import SelectedApp from '../demos/MobileTabBar.Page-selected';
import SchemaApp from '../demos/MobileTabBar.Page-schema';

describe('MobileTabBar.Item', () => {
  test('Basic', async () => {
    render(<BasicApp />);
    await waitForApp();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Test'));

    await waitFor(() => {
      expect(screen.getByText('Schema Test Page')).toBeInTheDocument();
    });
  });

  test('Selected', async () => {
    render(<SelectedApp />);
    await waitForApp();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(document.querySelector('.adm-tab-bar-item-active')).toBeInTheDocument();
  });

  test('Schema', async () => {
    render(<SchemaApp />);
    await waitForApp();

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeInTheDocument();
    expect(screen.queryByTestId('schema-json')).toMatchInlineSnapshot(`
      <pre
        data-testid="schema-json"
      >
        {
        "_isJSONSchemaObject": true,
        "version": "2.0",
        "name": "schema",
        "type": "void",
        "x-decorator": "BlockItem",
        "x-settings": "mobile:tab-bar:page",
        "x-component": "MobileTabBar.Page",
        "x-toolbar-props": {
          "showBorder": false,
          "showBackground": true
        },
        "x-component-props": {
          "title": "Test",
          "icon": "AppstoreOutlined",
          "schemaUid": "test"
        }
      }
      </pre>
    `);
  });
});
