/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { screen, renderAppOptions, renderReadPrettyApp, userEvent, waitFor } from '@nocobase/test/client';

describe('NanoIDInput', () => {
  test('basic', async () => {
    await renderAppOptions({
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        version: '2.0',
        type: 'void',
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'interfaces',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '28rbti2f9jx': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              'nano-iD': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-collection-field': 'interfaces.nano-iD',
                'x-component-props': {},
                'x-app-version': '0.21.0-alpha.10',
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
    });

    await waitFor(() => {
      const input: any = screen.queryByRole('textbox');
      expect(input).toBeInTheDocument();
      const value = input.value;
      expect(value).toHaveLength(21);
    });

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), '123');

    await waitFor(() => {
      expect(screen.queryByText('Field value size is 21')).toBeInTheDocument();
    });

    await userEvent.clear(screen.queryByRole('textbox'));
    await userEvent.type(screen.queryByRole('textbox'), 'rdQ1G9iPEtjR6BpIAPilZ');

    await waitFor(() => {
      expect(screen.queryByText('Field value size is 21')).not.toBeInTheDocument();
    });
  });

  test('read pretty', async () => {
    await renderReadPrettyApp({
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        version: '2.0',
        type: 'void',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'interfaces',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '28rbti2f9jx': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              'nano-iD': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                'x-toolbar': 'FormItemSchemaToolbar',
                'x-settings': 'fieldSettings:FormItem',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                default: 'rdQ1G9iPEtjR6BpIAPilZ',
                'x-read-pretty': true,
                'x-collection-field': 'interfaces.nano-iD',
                'x-component-props': {},
                'x-app-version': '0.21.0-alpha.10',
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
    });

    expect(document.querySelector('.ant-description-input')?.textContent).toBe('rdQ1G9iPEtjR6BpIAPilZ');
  });
});
