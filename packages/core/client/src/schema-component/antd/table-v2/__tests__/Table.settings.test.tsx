import {
  BlockSchemaComponentPlugin,
  FixedBlock,
  TableBlockProvider,
  useTableBlockDecoratorProps,
} from '@nocobase/client';
import { checkSettings, renderSettings, checkSchema, screen, userEvent, waitFor } from '@nocobase/test/client';
import { withSchema } from '@nocobase/test/web';

describe('Table.settings', () => {
  const TableBlockProviderWithSchema = withSchema(TableBlockProvider);
  beforeAll(async () => {
    await renderSettings({
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
              collection: 'users',
              dataSource: 'main',
              action: 'list',
              rowKey: 'id',
              showIndex: true,
              dragSort: false,
            },
            'x-toolbar': 'BlockSchemaToolbar',
            'x-settings': 'blockSettings:table',
            'x-component': 'CardItem',
            'x-index': 1,
          },
        },
      },
      appOptions: {
        components: {
          TableBlockProviderWithSchema,
          FixedBlock,
        },
        plugins: [BlockSchemaComponentPlugin],
        scopes: {
          useTableBlockDecoratorProps,
        },
      },
    });
  });

  test('menu list', async () => {
    await checkSettings(
      [
        {
          title: 'Edit block title',
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
          title: 'Fix block',
          type: 'switch',
          async afterFirstClick() {
            await checkSchema({
              'x-decorator-props': {
                fixedBlock: true,
              },
            });
          },
          async afterSecondClick() {
            await checkSchema({
              'x-decorator-props': {
                fixedBlock: false,
              },
            });
          },
        },
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
              await userEvent.click(screen.getByText('Load data after filtering'));
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
          title: 'Save as template',
          type: 'modal',
        },
        {
          title: 'Delete',
          type: 'delete',
        },
      ],
      true,
    );
  });
});
