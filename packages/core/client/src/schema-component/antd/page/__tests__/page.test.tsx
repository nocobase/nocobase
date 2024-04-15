import { render, screen, waitFor, renderApp, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import { Page } from '../Page';
import { DocumentTitleProvider, Form, FormItem, Grid, IconPicker, Input } from '@nocobase/client';

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
      await renderApp({
        schema: {
          type: 'void',
          title,
          'x-component': Page,
        },
      });

      expect(screen.getByText(title)).toBeInTheDocument();
    });

    test('hide title', async () => {
      await renderApp({
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
      await renderApp({
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
      await renderApp({
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
      });

      expect(screen.getByRole('tablist')).toBeInTheDocument();

      expect(screen.getByText('tab1 title')).toBeInTheDocument();
      expect(screen.getByText('tab1 content')).toBeInTheDocument();

      // 没有 title 的时候会使用 Unnamed
      expect(screen.getByText('Unnamed')).toBeInTheDocument();
    });

    test('add tab', async () => {
      await renderApp({
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
