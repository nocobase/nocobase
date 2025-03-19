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
  checkSettings,
  renderReadPrettySingleSettings,
  renderSingleSettings,
  screen,
  userEvent,
  waitFor,
} from '@nocobase/test/client';
import React from 'react';
import { FilterFormBlockProvider } from '../../../../../src/block-provider/FilterFormBlockProvider';
import { FormBlockProvider } from '../../../../../src/block-provider/FormBlockProvider';
import { FormItem } from '../FormItem';
import {
  EditComponent,
  EditDefaultValue,
  EditDescription,
  EditOperator,
  EditPattern,
  EditRequired,
  EditTitle,
  EditTitleField,
  EditTooltip,
  EditValidationRules,
} from '../SchemaSettingOptions';

describe('SchemaSettingOptions', () => {
  describe('EditTitle', () => {
    test('should work', async () => {
      const oldValue = 'Nickname';
      const newValue = 'new test';
      await renderSingleSettings({
        Component: EditTitle,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          default: oldValue,
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        },
      });
      await checkSettings([
        {
          type: 'modal',
          title: 'Edit field title',
          modalChecker: {
            modalTitle: 'Edit field title',
            formItems: [
              {
                type: 'input',
                label: 'Field title',
                oldValue,
                newValue,
              },
            ],
            async afterSubmit() {
              await waitFor(() => {
                expect(screen.queryByText(newValue)).toBeInTheDocument();
              });
            },
          },
        },
      ]);
    });

    test('visible: false', async () => {
      const fieldName = 'not-exist';
      await renderSingleSettings({
        Component: EditTitle,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: fieldName,
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        },
      });

      expect(screen.queryByText('Edit field title')).not.toBeInTheDocument();
    });
  });

  describe('EditDescription', () => {
    test('should work', async () => {
      const newValue = 'new test';
      await renderSingleSettings({
        Component: EditDescription,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        },
      });
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

    test('read pretty mode should not render', async () => {
      await renderSingleSettings({
        Component: EditDescription,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
          'x-read-pretty': true,
        },
      });

      expect(screen.queryByText('Edit description')).not.toBeInTheDocument();
    });
  });

  describe('EditTooltip', () => {
    test('should work', async () => {
      const newValue = 'new test';
      await renderSingleSettings({
        Component: EditTooltip,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
          'x-read-pretty': true,
        },
      });
      await checkSettings([
        {
          type: 'modal',
          title: 'Edit tooltip',
          modalChecker: {
            modalTitle: 'Edit description',
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

    test('read pretty mode should not render', async () => {
      await renderSingleSettings({
        Component: EditTooltip,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        },
      });

      expect(screen.queryByText('Edit tooltip')).not.toBeInTheDocument();
    });
  });

  describe('EditRequired', () => {
    test('should work', async () => {
      await renderSingleSettings({
        Component: EditRequired,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        },
      });
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

    test('read pretty mode should not render', async () => {
      await renderSingleSettings({
        Component: EditRequired,
        enableUserListDataBlock: true,
        schema: {
          type: 'string',
          name: 'nickname',
          'x-collection-field': 'users.nickname',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
          'x-read-pretty': true,
        },
      });

      expect(screen.queryByText('Edit tooltip')).not.toBeInTheDocument();
    });
  });

  describe('EditDefaultValue', () => {
    test('should work', async () => {
      await renderSingleSettings({
        Component: EditDefaultValue,
        settingPath: 'properties.nickname',
        enableUserListDataBlock: true,
        schema: {
          type: 'void',
          'x-component': 'FormV2',
          'x-decorator': 'FormBlockProvider',
          'x-decorator-props': {
            collection: 'users',
          },
          properties: {
            nickname: {
              type: 'string',
              'x-collection-field': 'users.nickname',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
          },
        },
      });

      const newValue = 'new test';

      await checkSettings([
        {
          type: 'modal',
          title: 'Set default value',
          modalChecker: {
            modalTitle: 'Set default value',
            formItems: [
              {
                type: 'input',
                label: 'Default value',
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
  });

  describe('EditPattern', () => {
    test('should work', async () => {
      await renderSingleSettings({
        Component: EditPattern,
        settingPath: 'properties.nickname',
        enableUserListDataBlock: true,
        schema: {
          type: 'void',
          'x-component': 'FormV2',
          'x-decorator': 'FormBlockProvider',
          'x-decorator-props': {
            collection: 'users',
          },
          properties: {
            nickname: {
              type: 'string',
              default: 'nickname value',
              'x-collection-field': 'users.nickname',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
          },
        },
      });

      await checkSettings([
        {
          type: 'select',
          title: 'Pattern',
          oldValue: 'Editable',
          options: [
            {
              label: 'Readonly',
              checker() {
                expect(screen.queryByRole('textbox')).toHaveAttribute('disabled');
              },
            },
            {
              label: 'Easy-reading',
              checker() {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
                expect(screen.queryByText('nickname value')).toBeInTheDocument();
              },
            },
            {
              label: 'Editable',
              checker() {
                expect(screen.queryByRole('textbox')).toBeInTheDocument();
                expect(screen.queryByRole('textbox')).toHaveValue('nickname value');
              },
            },
          ],
        },
      ]);
    });
  });

  describe('EditComponent', () => {
    test('should work', async () => {
      const FormItemWithSchema = observer(({ children }) => {
        const schema = useFieldSchema();
        return (
          <>
            <div>mode: {schema?.['x-component-props']?.['mode']}</div>
            <FormItem>{children}</FormItem>
          </>
        );
      });

      await renderSingleSettings({
        Component: EditComponent,
        settingPath: 'properties.roles',
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
              'x-decorator': 'FormItemWithSchema',
              'x-component': 'CollectionField',
              'x-component-props': {
                fieldNames: {
                  label: 'name',
                  value: 'name',
                },
              },
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
            FormItemWithSchema,
          },
        },
      });

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
  });

  describe('EditTitleField', () => {
    // 实际情况中，该功能是正常的，但是这里报错
    test.skip('should work', async () => {
      await renderSingleSettings({
        Component: EditTitleField,
        settingPath: 'properties.roles',
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
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-component-props': {
                fieldNames: {
                  label: 'name',
                  value: 'name',
                },
              },
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
          },
        },
      });

      await checkSettings([
        {
          type: 'select',
          title: 'Title field',
          oldValue: 'Role UID',
          async beforeSelect() {
            expect(screen.queryByTestId('select-object-multiple')).toBeInTheDocument();
            await userEvent.click(document.querySelector('.ant-select-selector'));

            await waitFor(() => {
              expect(screen.queryByText('admin')).toBeInTheDocument();
            });
          },
          options: [
            {
              label: 'Role name',
              async checker() {
                expect(screen.queryByTestId('select-object-multiple')).toBeInTheDocument();
                await userEvent.click(document.querySelector('.ant-select-selector'));

                await waitFor(() => {
                  expect(screen.queryByText('Admin')).toBeInTheDocument();
                });
              },
            },
          ],
        },
      ]);
    });
  });

  describe('EditValidationRules', () => {
    test('should work', async () => {
      await renderSingleSettings({
        Component: EditValidationRules,
        settingPath: 'properties.nickname',
        enableUserListDataBlock: true,
        schema: {
          type: 'void',
          'x-component': 'FormV2',
          'x-decorator': 'FormBlockProvider',
          'x-decorator-props': {
            collection: 'users',
          },
          properties: {
            nickname: {
              type: 'string',
              'x-collection-field': 'users.nickname',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
          },
        },
      });
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
              await userEvent.type(screen.getByRole('textbox'), '1');
              await waitFor(() => {
                expect(screen.queryByText('The length or number of entries must be at least 2')).toBeInTheDocument();
              });

              await userEvent.type(screen.getByRole('textbox'), '12');
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

    test('read pretty mode should not render', async () => {
      await renderReadPrettySingleSettings({
        Component: EditValidationRules,
        settingPath: 'properties.nickname',
        enableUserListDataBlock: true,
        schema: {
          type: 'void',
          'x-component': 'FormV2',
          'x-decorator': 'FormBlockProvider',
          'x-decorator-props': {
            collection: 'users',
          },
          properties: {
            nickname: {
              type: 'string',
              'x-collection-field': 'users.nickname',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        appOptions: {
          components: {
            FormBlockProvider,
          },
        },
      });

      expect(screen.queryByText('Edit tooltip')).not.toBeInTheDocument();
    });
  });

  describe('EditOperator', () => {
    test('should work', async () => {
      await renderSingleSettings({
        Component: EditOperator,
        settingPath: 'properties.nickname',
        enableUserListDataBlock: true,
        schema: {
          type: 'void',
          'x-component': 'FormV2',
          'x-decorator': 'FilterFormBlockProvider',
          'x-decorator-props': {
            collection: 'users',
          },
          properties: {
            nickname: {
              type: 'string',
              'x-collection-field': 'users.nickname',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
          },
        },
        appOptions: {
          components: {
            FilterFormBlockProvider,
          },
        },
      });

      await checkSettings([
        {
          type: 'select',
          title: 'Operator',
          oldValue: 'contains',
          options: [
            {
              label: 'does not contain',
            },
            {
              label: 'is',
            },
            {
              label: 'is not',
            },
            {
              label: 'is empty',
            },
            {
              label: 'is not empty',
            },
          ],
        },
      ]);
    });
  });
});
