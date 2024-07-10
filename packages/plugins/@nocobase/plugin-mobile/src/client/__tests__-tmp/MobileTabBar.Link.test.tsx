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
import InnerApp from '../demos/MobileTabBar.Link-inner';
import OuterApp from '../demos/MobileTabBar.Link-outer';
import SelectedApp from '../demos/MobileTabBar.Link-selected';
import SchemaApp from '../demos/MobileTabBar.Link-schema';

describe('MobileTabBar.Item', () => {
  test('Inner Link', async () => {
    render(<InnerApp />);
    await waitForApp();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Test'));

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  test('Outer Link', async () => {
    render(<OuterApp />);
    await waitForApp();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeInTheDocument();

    const originOpen = window.open;
    const origin = vitest.fn();
    window.open = origin;

    await userEvent.click(screen.getByText('Test'));

    await waitFor(() => {
      expect(origin).toBeCalled();
    });

    window.open = originOpen;
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

    expect(screen.getByText('Link')).toBeInTheDocument();
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
        "x-settings": "mobile:tab-bar:link",
        "x-component": "MobileTabBar.Link",
        "x-toolbar-props": {
          "showBorder": false,
          "showBackground": true
        },
        "x-component-props": {
          "title": "Link",
          "icon": "AppstoreOutlined",
          "url": "https://github.com"
        }
      }
      </pre>
    `);
  });
});
