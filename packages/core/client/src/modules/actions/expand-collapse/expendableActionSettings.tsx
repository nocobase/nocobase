/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../..';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsModalItem, SchemaSettingsLinkageRules } from '../../../schema-settings';

function ButtonEditor() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { titleExpand, titleCollapse, iconExpand, iconCollapse } = fieldSchema['x-component-props'] || {};
  return (
    <SchemaSettingsModalItem
      title={t('Edit button')}
      schema={
        {
          type: 'object',
          title: t('Edit button'),
          properties: {
            titleExpand: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: `${t('Button title')} - ${t('Expand all')}`,
              default: titleExpand,
            },
            titleCollapse: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: `${t('Button title')} - ${t('Collapse all')}`,
              default: titleCollapse,
            },
            iconExpand: {
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: `${t('Button icon')} - ${t('Expand all')}`,
              default: iconExpand,
            },
            iconCollapse: {
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: `${t('Button icon')} - ${t('Collapse all')}`,
              default: iconCollapse,
            },
            type: {
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              title: t('Button background color'),
              default: fieldSchema?.['x-component-props']?.danger
                ? 'danger'
                : fieldSchema?.['x-component-props']?.type === 'primary'
                  ? 'primary'
                  : 'default',
              enum: [
                { value: 'default', label: '{{t("Default")}}' },
                { value: 'primary', label: '{{t("Highlight")}}' },
                { value: 'danger', label: '{{t("Danger red")}}' },
              ],
            },
          },
        } as ISchema
      }
      onSubmit={({ titleExpand, titleCollapse, iconExpand, iconCollapse, type }) => {
        fieldSchema.title = t('Expand/Collapse');
        field.title = t('Expand/Collapse');
        field.componentProps.icon = iconExpand;
        field.componentProps.danger = type === 'danger';
        field.componentProps.type = type;
        fieldSchema['x-component-props'] = {
          ...(fieldSchema['x-component-props'] || {}),
          titleExpand,
          titleCollapse,
          iconExpand,
          iconCollapse,
          type,
          danger: type === 'danger',
        };
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
            title: fieldSchema.title,
          },
        });
        dn.refresh();
      }}
    />
  );
}
export const expendableActionSettings = new SchemaSettings({
  name: 'actionSettings:expendable',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();

        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});
