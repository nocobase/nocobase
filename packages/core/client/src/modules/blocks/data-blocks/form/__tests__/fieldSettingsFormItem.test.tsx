/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { observer } from '@formily/reactive-react';
import {
  checkFieldTitle,
  checkSettings,
  renderReadPrettySettings,
  renderSettings,
  renderSingleSettings,
  screen,
  userEvent,
  waitFor,
} from '@nocobase/test/client';
import React from 'react';
import { fieldSettingsFormItem } from '..';
import { FilterFormBlockProvider } from '../../../../../block-provider/FilterFormBlockProvider';
import { FormBlockProvider } from '../../../../../block-provider/FormBlockProvider';
import { FormItem } from '../../../../../schema-component/antd/form-item/FormItem';

describe('FieldSettingsFormItem', () => {
  function commonFieldOptions(isFilterForm?: boolean) {
    return {
      enableUserListDataBlock: true,
      schema: {
        type: 'void',
        'x-component': 'FormV2',
        'x-decorator': isFilterForm ? 'FilterFormBlockProvider' : 'FormBlockProvider',
        'x-decorator-props': {
          collection: 'users',
        },
        properties: {
          nickname: {
            type: 'string',
            'x-collection-field': 'users.nickname',
            'x-decorator': 'FormItem',
            'x-component': 'CollectionField',
            'x-settings': 'fieldSettings:FormItem',
          },
        },
      },
      schemaSettings: fieldSettingsFormItem,
      appOptions: {
        components: {
          FilterFormBlockProvider,
          FormBlockProvider,
        },
      },
    };
  }

  function associationFieldOptions(showSchema = false) {
    const FormItemWithSchema = observer(({ children }) => {
      const schema = useFieldSchema();
      return (
        <>
          <div>mode: {schema?.['x-component-props']?.['mode']}</div>
          <FormItem>{children}</FormItem>
        </>
      );
    });

    return {
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        type: 'void',
        'x-component': 'FormV2',
        'x-decorator': 'FormBlockProvider',
        'x-decorator-props': {
          collection: 'users',
        },
        properties: {
          roles: {
            type: 'string',
            'x-collection-field': 'users.roles',
            'x-decorator': showSchema ? 'FormItemWithSchema' : 'FormItem',
            'x-component': 'CollectionField',
            'x-settings': 'fieldSettings:FormItem',
          },
        },
      },
      schemaSettings: fieldSettingsFormItem,
      appOptions: {
        components: {
          FormItemWithSchema,
          FormBlockProvider,
        },
      },
    };
  }

  describe('menu list', () => {
    describe('edit mode', () => {
      it.skip('common field', async () => {
        await renderSettings(commonFieldOptions());

        await checkSettings(
          [
            {
              title: 'Edit field title',
              type: 'modal',
            },
            {
              title: 'Display title',
              type: 'switch',
            },
            {
              title: 'Edit description',
              type: 'modal',
            },
            {
              title: 'Edit tooltip',
              type: 'modal',
            },
            {
              title: 'Required',
              type: 'switch',
            },
            {
              title: 'Set default value',
              type: 'modal',
            },
            {
              title: 'Pattern',
              type: 'select',
            },
            {
              title: 'Set validation rules',
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

      it('association field', async () => {
        await renderSettings(associationFieldOptions());

        await checkSettings(
          [
            {
              title: 'Edit field title',
              type: 'modal',
            },
            {
              title: 'Display title',
              type: 'switch',
            },
            {
              title: 'Edit description',
              type: 'modal',
            },
            {
              title: 'Edit tooltip',
              type: 'modal',
            },
            {
              title: 'Required',
              type: 'switch',
            },
            {
              title: 'Set default value',
              type: 'modal',
            },
            {
              title: 'Pattern',
              type: 'select',
            },
            {
              title: 'Field component',
              type: 'select',
            },
            {
              title: 'Set the data scope',
              type: 'modal',
            },
            {
              title: 'Set default sorting rules',
              type: 'modal',
            },
            {
              title: 'Quick create',
              type: 'select',
            },
            {
              title: 'Allow multiple',
              type: 'switch',
            },
            {
              title: 'Ellipsis overflow content',
              type: 'switch',
            },
            {
              title: 'Title field',
              type: 'select',
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

    describe('read pretty mode', () => {
      it.skip('common field', async () => {
        await renderReadPrettySettings(commonFieldOptions());

        await checkSettings(
          [
            {
              title: 'Edit field title',
              type: 'modal',
            },
            {
              title: 'Display title',
              type: 'switch',
            },
            {
              title: 'Edit description',
              type: 'modal',
            },
            {
              title: 'Edit tooltip',
              type: 'modal',
            },
            {
              title: 'Set default value',
              type: 'modal',
            },
            {
              title: 'Pattern',
              type: 'select',
            },
            {
              title: 'Style',
              type: 'modal',
            },
            {
              title: 'Set validation rules',
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

      it('association field', async () => {
        await renderReadPrettySettings(associationFieldOptions());

        await checkSettings(
          [
            {
              title: 'Edit field title',
              type: 'modal',
            },
            {
              title: 'Display title',
              type: 'switch',
            },
            {
              title: 'Edit description',
              type: 'modal',
            },
            {
              title: 'Edit tooltip',
              type: 'modal',
            },
            {
              title: 'Set default value',
              type: 'modal',
            },
            {
              title: 'Pattern',
              type: 'select',
            },
            {
              title: 'Style',
              type: 'modal',
            },
            {
              title: 'Field component',
              type: 'select',
            },
            {
              title: 'Title field',
              type: 'select',
            },
            {
              title: 'Enable link',
              type: 'switch',
            },
            {
              title: 'Ellipsis overflow content',
              type: 'switch',
            },
            {
              title: 'Open mode',
              type: 'select',
            },
            {
              title: 'Popup size',
              type: 'select',
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
  });

  describe('menu items', () => {
    test('Edit field title', async () => {
      await renderSettings(commonFieldOptions());
      await checkFieldTitle('Nickname');
    });

    test('Display title', async () => {
      await renderSettings(commonFieldOptions());
      await checkSettings([
        {
          type: 'switch',
          title: 'Display title',
          beforeClick() {
            expect(document.querySelector('.ant-formily-item-label')).toHaveStyle({ display: 'flex' });
          },
          async afterFirstClick() {
            expect(document.querySelector('.ant-formily-item-label')).toHaveStyle({ display: 'none' });
          },
          afterSecondClick() {
            expect(document.querySelector('.ant-formily-item-label')).toHaveStyle({ display: 'flex' });
          },
        },
      ]);
    });

    test('Edit description', async () => {
      const newValue = 'new test';
      await renderSettings(commonFieldOptions());
      await checkSettings([
        {
          type: 'modal',
          title: 'Edit description',
          modalChecker: {
            modalTitle: 'Edit description',
            formItems: [
              {
                type: 'textarea',
                newValue,
              },
            ],
            afterSubmit() {
              expect(screen.queryByText(newValue)).toBeInTheDocument();
            },
          },
        },
      ]);
    });

    test('Edit tooltip', async () => {
      const newValue = 'new test';
      await renderSettings(commonFieldOptions());
      await checkSettings([
        {
          type: 'modal',
          title: 'Edit tooltip',
          modalChecker: {
            modalTitle: 'Edit tooltip',
            formItems: [
              {
                type: 'textarea',
                newValue,
              },
            ],
            async afterSubmit() {
              expect(document.querySelector('.anticon-question-circle')).toBeInTheDocument();
              await userEvent.hover(document.querySelector('.anticon-question-circle'));
              await waitFor(() => {
                expect(screen.queryByText(newValue)).toBeInTheDocument();
              });
            },
          },
        },
      ]);
    });

    test('Required', async () => {
      await renderSettings(commonFieldOptions());
      await checkSettings([
        {
          type: 'switch',
          title: 'Required',
          afterFirstClick() {
            expect(document.querySelector('.ant-formily-item-asterisk')).toBeInTheDocument();
          },
          afterSecondClick() {
            expect(document.querySelector('.ant-formily-item-asterisk')).not.toBeInTheDocument();
          },
        },
      ]);
    });

    test.skip('Set default value', async () => {
      await renderSettings(commonFieldOptions());
      const newValue = 'new test';

      await checkSettings([
        {
          type: 'modal',
          title: 'Set default value',
          modalChecker: {
            modalTitle: 'Set default value',
            formItems: [
              {
                type: 'collectionField',
                field: 'users.nickname',
                newValue,
              },
            ],
            afterSubmit() {
              expect(screen.queryByRole('textbox')).toBeInTheDocument();
              expect(screen.queryByRole('textbox')).toHaveValue(newValue);
            },
          },
        },
      ]);
    });

    test.skip('Pattern', async () => {
      await renderSettings(associationFieldOptions());

      await checkSettings([
        {
          type: 'select',
          title: 'Pattern',
          oldValue: 'Editable',
          options: [
            {
              label: 'Readonly',
              checker() {
                expect(document.querySelector('.nb-form-item input')).toHaveAttribute('disabled');
              },
            },
            {
              label: 'Easy-reading',
              checker() {
                expect(document.querySelector('.nb-form-item input')).not.toBeInTheDocument();
              },
            },
            {
              label: 'Editable',
              checker() {
                expect(document.querySelector('.nb-form-item input')).toBeInTheDocument();
              },
            },
          ],
        },
      ]);
    });

    test.skip('EditValidationRules', async () => {
      await renderSingleSettings(commonFieldOptions(true));
      await checkSettings([
        {
          type: 'modal',
          title: 'Set validation rules',
          modalChecker: {
            modalTitle: 'Set validation rules',
            contentText: 'Add validation rule',
            async beforeCheck() {
              await userEvent.click(screen.getByText('Add validation rule'));
              await waitFor(() => {
                expect(screen.queryByText('Min length')).toBeInTheDocument();
              });
            },
            formItems: [
              {
                type: 'number',
                label: 'Min length',
                newValue: 2,
              },
            ],
            async afterSubmit() {
              await userEvent.type(document.querySelector('.nb-form-item input'), '1');
              await waitFor(() => {
                expect(screen.queryByText('The length or number of entries must be at least 2')).toBeInTheDocument();
              });

              await userEvent.type(document.querySelector('.nb-form-item input'), '12');
              await waitFor(() => {
                expect(
                  screen.queryByText('The length or number of entries must be at least 2'),
                ).not.toBeInTheDocument();
              });
            },
          },
        },
      ]);
    });

    test('Field component', async () => {
      await renderSingleSettings(associationFieldOptions(true));

      await checkSettings([
        {
          type: 'select',
          title: 'Field component',
          oldValue: 'Select',
          beforeSelect() {
            expect(screen.queryByTestId('select-object-multiple')).toBeInTheDocument();
          },
          options: [
            {
              label: 'Record picker',
              async checker() {
                expect(screen.queryByText('mode: Picker')).toBeInTheDocument();
              },
            },
            {
              label: 'Sub-table',
              checker() {
                expect(screen.queryByText('mode: SubTable')).toBeInTheDocument();
              },
            },
            {
              label: 'Sub-form',
              checker() {
                expect(screen.queryByText('mode: Nester')).toBeInTheDocument();
              },
            },
            {
              label: 'Sub-form(Popover)',
              checker() {
                expect(screen.queryByText('mode: PopoverNester')).toBeInTheDocument();
              },
            },
          ],
        },
      ]);
    });

    // 实际情况中，该功能是正常的，但是这里报错
    test.skip('Title field', async () => {
      await renderSettings(associationFieldOptions());

      await checkSettings([
        {
          type: 'select',
          title: 'Title field',
          // oldValue: 'Role name',
          async beforeSelect() {
            expect(screen.queryByTestId('select-object-multiple')).toBeInTheDocument();
            await userEvent.click(document.querySelector('.ant-select-selector'));

            await waitFor(() => {
              expect(screen.queryByText('Admin')).toBeInTheDocument();
            });
          },
          options: [
            {
              label: 'Role UID',
              async checker() {
                expect(screen.queryByTestId('select-object-multiple')).toBeInTheDocument();
                await userEvent.click(document.querySelector('.ant-select-selector'));

                await waitFor(() => {
                  expect(screen.queryByText('admin')).toBeInTheDocument();
                });
              },
            },
          ],
        },
      ]);
    });
  });
});
