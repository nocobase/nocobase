/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { renderAppOptions, screen, sleep, userEvent, waitFor } from '@nocobase/test/client';

describe('QuickEdit', () => {
  function getRenderOptions(readPretty = false) {
    return {
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'users',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '45i9guirvtz': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              roles: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-collection-field': 'users.roles',
                'x-component-props': {
                  fieldNames: {
                    label: 'name',
                    value: 'name',
                  },
                  addMode: 'modalAdd',
                  mode: 'SubTable',
                },
                'x-app-version': '0.21.0-alpha.10',
                default: null,
                properties: {
                  e2l1f5wo2st: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'AssociationField.SubTable',
                    'x-app-version': '0.21.0-alpha.10',
                    properties: {
                      '9x9jysv3hka': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-decorator': 'TableV2.Column.Decorator',
                        'x-component': 'TableV2.Column',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          'long-text': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            default: readPretty ? 'aaa' : null,
                            'x-collection-field': 'roles.long-text',
                            'x-component': 'CollectionField',
                            'x-component-props': {
                              ellipsis: true,
                            },
                            'x-decorator': 'QuickEdit',
                            'x-decorator-props': {
                              labelStyle: {
                                display: 'none',
                              },
                            },
                            'x-app-version': '0.21.0-alpha.10',
                            'x-read-pretty': readPretty,
                            'x-disabled': false,
                          },
                        },
                      },
                    },
                  },
                  uwe6lq47y0t: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    'x-action': 'create',
                    title: "{{t('Add new')}}",
                    'x-component': 'Action',
                    'x-component-props': {
                      openMode: 'drawer',
                      type: 'default',
                      component: 'CreateRecordAction',
                    },
                    type: 'void',
                    'x-app-version': '0.21.0-alpha.10',
                  },
                },
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
    };
  }

  it('basic', async () => {
    await renderAppOptions(getRenderOptions());

    await waitFor(() => {
      expect(document.querySelector('.nb-sub-table-addNew')).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.nb-sub-table-addNew'));
    await waitFor(() => {
      expect(document.querySelector('.ant-table-row')).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.ant-description-textarea'));
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).toBeInTheDocument();
    });

    await userEvent.type(screen.queryByRole('textbox'), 'hello world');

    await waitFor(() => {
      expect(document.querySelector('.ant-description-textarea')).toHaveTextContent('hello world');
    });
  });

  it('read pretty', async () => {
    await renderAppOptions(getRenderOptions(true));

    await waitFor(() => {
      expect(document.querySelector('.nb-sub-table-addNew')).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.nb-sub-table-addNew'));
    await waitFor(() => {
      expect(document.querySelector('.ant-table-row')).toBeInTheDocument();
      expect(document.querySelector('.ant-description-textarea')).toHaveTextContent('aaa');
    });

    await userEvent.click(document.querySelector('.ant-description-textarea'));
    await sleep(100);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
