/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin, TableBlockProvider, useTableBlockDecoratorProps } from '@nocobase/client';
import {
  CheckSettingsOptions,
  checkSchema,
  checkSettings,
  renderSettings,
  screen,
  userEvent,
  waitFor,
} from '@nocobase/test/client';
import { withSchema } from '@nocobase/test/web';

describe('Table.settings', () => {
  const TableBlockProviderWithSchema = withSchema(TableBlockProvider);

  const checkTableSettings = (more: CheckSettingsOptions[] = []) => {
    return checkSettings(
      [
        {
          title: 'Edit block title',
          type: 'modal',
        },
        {
          title: 'Set block height',
          type: 'modal',
        },
        {
          title: 'Block linkage rules',
          type: 'modal',
        },
        {
          title: 'Enable drag and drop sorting',
          type: 'switch',
          async afterFirstClick() {
            await checkSchema({
              'x-decorator-props': {
                dragSort: true,
              },
            });
            expect(screen.queryByText('Drag and drop sorting field')).toBeInTheDocument();

            await checkSettings([
              {
                title: 'Drag and drop sorting field',
                type: 'select',
                options: [
                  {
                    label: 'sort',
                    async checker() {
                      await checkSchema({
                        'x-decorator-props': {
                          dragSortBy: 'sortName',
                        },
                      });
                    },
                  },
                ],
              },
            ]);
          },
          async afterSecondClick() {
            await checkSchema({
              'x-decorator-props': {
                dragSort: false,
              },
            });
            expect(screen.queryByText('Drag and drop sorting field')).not.toBeInTheDocument();
          },
        },
        {
          title: 'Enable index column',
          type: 'switch',
        },
        // {
        //   title: 'Fix block',
        //   type: 'switch',
        //   async afterFirstClick() {
        //     await checkSchema({
        //       'x-decorator-props': {
        //         fixedBlock: true,
        //       },
        //     });
        //   },
        //   async afterSecondClick() {
        //     await checkSchema({
        //       'x-decorator-props': {
        //         fixedBlock: false,
        //       },
        //     });
        //   },
        // },
        {
          title: 'Set the data scope',
          type: 'modal',
          modalChecker: {
            modalTitle: 'Set the data scope',
            async beforeCheck() {
              await userEvent.click(screen.getByText('Add condition'));

              await waitFor(() => {
                expect(screen.queryByTestId('select-filter-field')).toBeInTheDocument();
              });

              const field = screen.queryByTestId('select-filter-field').querySelector('input');

              await userEvent.click(field);
              await waitFor(() => {
                expect(screen.queryByTitle('ID')).toBeInTheDocument();
              });
              await userEvent.click(screen.getByTitle('ID'));

              const value = document.querySelector('input[role=spinbutton]');
              await userEvent.type(value, '1');

              await waitFor(() => {
                expect(document.querySelector('input[role=spinbutton]')).toHaveValue('1');
              });
            },
            async afterSubmit() {
              await checkSchema({
                'x-decorator-props': {
                  params: {
                    filter: {
                      $and: [
                        {
                          id: {
                            $eq: 1,
                          },
                        },
                      ],
                    },
                  },
                },
              });
            },
          },
        },
        {
          title: 'Set default sorting rules',
          type: 'modal',
          modalChecker: {
            modalTitle: 'Set default sorting rules',
            contentText: 'Add sort field',
            async beforeCheck() {
              await userEvent.click(screen.getByText('Add sort field'));
              const dialog = screen.getByRole('dialog');
              await waitFor(() => {
                expect(dialog.querySelector('.ant-select-selector')).toBeInTheDocument();
              });
              await userEvent.click(dialog.querySelector('.ant-select-selector'));
              await waitFor(() => {
                expect(screen.queryByText('ID')).toBeInTheDocument();
              });
              await userEvent.click(screen.getByText('ID'));

              await userEvent.click(screen.getByText('DESC'));
            },
            async afterSubmit() {
              await checkSchema({
                'x-decorator-props': {
                  params: {
                    sort: ['-id'],
                  },
                },
              });
            },
          },
        },
        {
          title: 'Set data loading mode',
          type: 'modal',
          modalChecker: {
            modalTitle: 'Data loading mode',
            async beforeCheck() {
              await userEvent.click(screen.getByText('Do not load data when filter is empty'));
            },
            async afterSubmit() {
              await checkSchema({
                'x-decorator-props': {
                  dataLoadingMode: 'manual',
                },
              });
            },
          },
        },
        {
          title: 'Records per page',
          type: 'select',
          options: [
            {
              label: '10',
              async checker() {
                await checkSchema({
                  'x-decorator-props': {
                    params: {
                      pageSize: 10,
                    },
                  },
                });
              },
            },
            {
              label: '20',
            },
            {
              label: '50',
            },
            {
              label: '100',
            },
            {
              label: '100',
            },
          ],
        },
        {
          title: 'Table size',
          type: 'select',
          options: [
            {
              label: 'Large',
            },
            {
              label: 'Middle',
            },
            {
              label: 'Small',
            },
          ],
        },
        // {
        //   title: 'Save as template',
        //   type: 'modal',
        // },
        {
          title: 'Delete',
          type: 'delete',
        },
        ...more,
      ],
      true,
    );
  };

  const getRenderSettingsOptions = (isOld?: boolean, collection = 'users') => {
    const toolbarSchema = isOld
      ? {
          'x-designer': 'TableBlockDesigner',
        }
      : {
          'x-toolbar': 'BlockSchemaToolbar',
          'x-settings': 'blockSettings:table',
        };

    return {
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        type: 'void',
        'x-component': 'FixedBlock',
        properties: {
          table: {
            type: 'void',
            'x-decorator': 'TableBlockProviderWithSchema',
            'x-use-decorator-props': 'useTableBlockDecoratorProps',
            'x-decorator-props': {
              collection: collection,
              dataSource: 'main',
              action: 'list',
              rowKey: 'id',
              showIndex: true,
              dragSort: false,
              params: {
                pageSize: 20,
              },
            },
            ...toolbarSchema,
            'x-component': 'CardItem',
            'x-index': 1,
          },
        },
      },
      appOptions: {
        components: {
          TableBlockProviderWithSchema,
        },
        plugins: [BlockSchemaComponentPlugin],
        scopes: {
          useTableBlockDecoratorProps,
        },
      },
    };
  };

  test('menu list', async () => {
    await renderSettings(getRenderSettingsOptions());
    await checkTableSettings([
      {
        title: 'Save as template',
        type: 'modal',
      },
    ]);
  });

  test('old schema', async () => {
    await renderSettings(getRenderSettingsOptions(true));
    await checkTableSettings();
  });

  test('tree collection', async () => {
    await renderSettings(getRenderSettingsOptions(false, 'tree'));
    await checkSettings([
      {
        title: 'Tree table',
        type: 'switch',
        async afterFirstClick() {
          await checkSchema({
            'x-decorator-props': {
              treeTable: true,
            },
          });
        },
        async afterSecondClick() {
          await checkSchema({
            'x-decorator-props': {
              treeTable: false,
            },
          });
        },
      },
    ]);
  });
});
