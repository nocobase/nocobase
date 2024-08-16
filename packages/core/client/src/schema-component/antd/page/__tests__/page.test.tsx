/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DocumentTitleProvider, Form, FormItem, Grid, IconPicker, Input } from '@nocobase/client';
import { render, renderAppOptions, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import { isTabPage, navigateToTab, Page } from '../Page';

describe('Page', () => {
  it('should render correctly', async () => {
    render(<App1 />);

    await waitFor(() => {
      expect(screen.getByText(/page title/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/page content/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe('Page Title - NocoBase');
    });
  });

  describe('Page Component', () => {
    const title = 'Test Title';
    test('schema title', async () => {
      await renderAppOptions({
        schema: {
          type: 'void',
          title,
          'x-component': Page,
        },
      });

      expect(screen.getByText(title)).toBeInTheDocument();
    });

    test('hide title', async () => {
      await renderAppOptions({
        schema: {
          type: 'void',
          title,
          'x-component': Page,
          'x-component-props': {
            hidePageTitle: true,
          },
        },
      });

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    test('should request remote schema when no title', async () => {
      await renderAppOptions({
        schema: {
          type: 'void',
          'x-uid': 'test',
          'x-component': Page,
          'x-decorator': DocumentTitleProvider,
        },
        apis: {
          '/uiSchemas:getParentJsonSchema/test': {
            data: {
              title: 'remote title',
            },
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('remote title')).toBeInTheDocument();
      });
    });

    test('enablePageTabs', async () => {
      await renderAppOptions({
        schema: {
          type: 'void',
          title,
          'x-decorator': DocumentTitleProvider,
          'x-component': Page,
          'x-component-props': {
            enablePageTabs: true,
          },
          properties: {
            tab1: {
              type: 'void',
              title: 'tab1 title',
              'x-component': 'div',
              'x-content': 'tab1 content',
            },
            tab2: {
              type: 'void',
              'x-component': 'div',
              'x-content': 'tab2 content',
            },
          },
        },
        apis: {
          '/uiSchemas:insertAdjacent/test': { data: { result: 'ok' } },
        },
      });

      expect(screen.getByRole('tablist')).toBeInTheDocument();

      expect(screen.getByText('tab1 title')).toBeInTheDocument();
      expect(screen.getByText('tab1 content')).toBeInTheDocument();

      // 没有 title 的时候会使用 Unnamed
      expect(screen.getByText('Unnamed')).toBeInTheDocument();
    });

    test('add tab', async () => {
      await renderAppOptions({
        schema: {
          type: 'void',
          title,
          'x-decorator': DocumentTitleProvider,
          'x-component': Page,
          'x-component-props': {
            enablePageTabs: true,
          },
        },
        appOptions: {
          designable: true,
          components: {
            Input,
            Form,
            FormItem,
            IconPicker,
            Grid,
          },
        },
        apis: {
          '/uiSchemas:insertAdjacent/test?position=beforeEnd': { data: { result: 'ok' } },
        },
      });

      await userEvent.click(screen.getByText('Add tab'));

      await waitFor(() => {
        expect(screen.queryByText('Tab name')).toBeInTheDocument();
      });

      await userEvent.type(screen.queryByRole('textbox'), 'tab1');

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('tab1')).toBeInTheDocument();
      });
    });
  });
});

describe('utils', () => {
  it('isTabPage', () => {
    expect(isTabPage('/admin')).toBe(false);
    expect(isTabPage('/admin/test/tabs/tabId')).toBe(true);
    expect(isTabPage('/admin/test/tabs/tabId/')).toBe(true);
  });

  it('navigateToTab', () => {
    const navigate1 = vi.fn();
    const navigate2 = vi.fn();
    const navigate3 = vi.fn();
    const navigate4 = vi.fn();
    const navigate5 = vi.fn();
    const navigate6 = vi.fn();
    const navigate7 = vi.fn();
    const navigate8 = vi.fn();

    navigateToTab('tabId', navigate1, '/admin/test');
    expect(navigate1).toBeCalledWith('/admin/test/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate2, '/admin/test/');
    expect(navigate2).toBeCalledWith('/admin/test/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate3, '/admin/test/tabs/oldTabId');
    expect(navigate3).toBeCalledWith('/admin/test/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate4, '/admin/test/tabs/oldTabId/');
    expect(navigate4).toBeCalledWith('/admin/test/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate5, '/admin/test/tabs/tab1/pages/pageId/tabs/tab2');
    expect(navigate5).toBeCalledWith('/admin/test/tabs/tab1/pages/pageId/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate6, '/admin/test/tabs/tab1/pages/pageId/tabs/tab2/');
    expect(navigate6).toBeCalledWith('/admin/test/tabs/tab1/pages/pageId/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate7, '/admin/test/tabs/tab1/pages/pageId');
    expect(navigate7).toBeCalledWith('/admin/test/tabs/tab1/pages/pageId/tabs/tabId', { replace: true });

    navigateToTab('tabId', navigate8, '/admin/test/tabs/tab1/pages/pageId/');
    expect(navigate8).toBeCalledWith('/admin/test/tabs/tab1/pages/pageId/tabs/tabId', { replace: true });
  });
});
