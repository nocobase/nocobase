/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin, TableV2, useTableBlockDecoratorProps } from '@nocobase/client';
import { checkSchema, checkSettings, renderSettings, screen, waitFor } from '@nocobase/test/client';
import { withSchema } from '@nocobase/test/web';

describe('Table.Column.settings', () => {
  const TableColumnDecoratorWithSchema = withSchema(TableV2.Column.Decorator);

  const getRenderOptions = (isOld?: boolean, field = 'nickname') => {
    const schema = isOld
      ? {
          'x-designer': 'TableV2.Column.Designer',
        }
      : {
          'x-toolbar': 'TableColumnSchemaToolbar',
          'x-settings': 'fieldSettings:TableColumn',
        };
    return {
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-decorator': 'TableBlockProvider',
        'x-use-decorator-props': 'useTableBlockDecoratorProps',
        'x-decorator-props': {
          collection: 'users',
          dataSource: 'main',
          action: 'list',
          params: {
            pageSize: 20,
          },
          rowKey: 'id',
          showIndex: true,
          dragSort: false,
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          f8bvd77sp6p: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'array',
            'x-component': 'TableV2',
            'x-use-component-props': 'useTableBlockProps',
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
            },
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              ct00e0xr996: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-decorator': 'TableColumnDecoratorWithSchema',
                ...schema,
                'x-component': 'TableV2.Column',
                'x-app-version': '0.21.0-alpha.10',
                'x-component-props': {},
                properties: {
                  [field]: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    'x-collection-field': `users.${field}`,
                    'x-component': 'CollectionField',
                    'x-component-props': {
                      ellipsis: true,
                    },
                    'x-read-pretty': true,
                    'x-decorator': null,
                    'x-decorator-props': {
                      labelStyle: {
                        display: 'none',
                      },
                    },
                    'x-app-version': '0.21.0-alpha.10',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-async': false,
                'x-index': 3,
              },
            },
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': false,
        'x-index': 1,
      },
      appOptions: {
        components: {
          TableColumnDecoratorWithSchema,
        },
        plugins: [BlockSchemaComponentPlugin],
        scopes: {
          useTableBlockDecoratorProps,
        },
      },
    };
  };

  const checkCommonField = () => {
    return checkSettings([
      {
        type: 'modal',
        title: 'Custom column title',
        modalChecker: {
          modalTitle: 'Custom column title',
          formItems: [
            {
              type: 'input',
              label: 'Column title',
              newValue: 'test',
            },
          ],
          async afterSubmit() {
            await checkSchema({
              title: 'test',
            });
          },
        },
      },
      {
        type: 'modal',
        title: 'Column width',
        modalChecker: {
          modalTitle: 'Column width',
          formItems: [
            {
              type: 'number',
              newValue: '300',
            },
          ],
          async afterSubmit() {
            await checkSchema({
              'x-component-props': {
                width: 300,
              },
            });
          },
        },
      },
      {
        type: 'switch',
        title: 'Sortable',
        async afterFirstClick() {
          await checkSchema({
            'x-component-props': {
              sorter: true,
            },
          });
        },
        async afterSecondClick() {
          await checkSchema({
            'x-component-props': {
              sorter: false,
            },
          });
        },
      },
    ]);
  };

  const checkAssociationField = () => {
    return checkSettings([
      {
        type: 'modal',
        title: 'Custom column title',
        modalChecker: {
          modalTitle: 'Custom column title',
          formItems: [
            {
              type: 'input',
              label: 'Column title',
              newValue: 'test',
            },
          ],
          async afterSubmit() {
            await checkSchema({
              title: 'test',
            });
          },
        },
      },
      {
        type: 'modal',
        title: 'Column width',
        modalChecker: {
          modalTitle: 'Column width',
          formItems: [
            {
              type: 'number',
              newValue: '300',
            },
          ],
          async afterSubmit() {
            await checkSchema({
              'x-component-props': {
                width: 300,
              },
            });
          },
        },
      },
      {
        type: 'switch',
        title: 'Enable link',
        async afterFirstClick() {
          expect(screen.queryByText('Admin').tagName).toBe('SPAN');
        },
        async afterSecondClick() {
          expect(screen.queryByText('Admin').tagName).toBe('A');
        },
      },
      {
        type: 'select',
        title: 'Field component',
        oldValue: 'Title',
        options: [
          {
            label: 'Tag',
            async checker() {
              await waitFor(() => {
                expect(screen.queryByText('Admin')).toHaveClass('ant-tag');
              });
            },
          },
          {
            label: 'Title',
            async checker() {
              await waitFor(() => {
                const el = screen.queryByText('Admin');
                expect(el?.tagName).toBe('A');
              });
            },
          },
          {
            label: 'Tag',
            async checker() {},
          },
        ],
      },
      {
        type: 'select',
        title: 'Tag color field',
        options: [
          {
            label: 'color',
            async checker() {
              await waitFor(() => {
                expect(screen.queryByText('Admin')).toHaveStyle('background-color: rgb(22, 119, 255);');
              });
            },
          },
        ],
      },
      {
        type: 'select',
        title: 'Title field',
        options: [
          {
            label: 'Role UID',
            async checker() {
              expect(screen.queryByText('admin')).toBeInTheDocument();
            },
          },
          {
            label: 'Role name',
            async checker() {
              await waitFor(() => {
                expect(screen.queryByText('Admin')).toBeInTheDocument();
              });
            },
          },
        ],
      },
    ]);
  };

  describe.skip('new version schema', () => {
    test('common field', async () => {
      await renderSettings(getRenderOptions());
      await checkCommonField();
    });

    test('association field', async () => {
      await renderSettings(getRenderOptions(false, 'roles'));
      await checkAssociationField();
    });
  });

  describe.skip('old version schema', () => {
    test('common field', async () => {
      await renderSettings(getRenderOptions(true));
      await checkCommonField();
    });

    test('association field', async () => {
      await renderSettings(getRenderOptions(true, 'roles'));
      await checkAssociationField();
    });
  });
});
