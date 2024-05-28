/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { useTranslation } from 'react-i18next';
import { SchemaSettingsLinkageRules, SchemaSettingsModalItem } from '../../../schema-settings';
import { useDesignable, useFormBlockContext, useRecord, Variable, Input } from '../../../';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';

export function SchemaSettingsActionLinkItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { form } = useFormBlockContext();
  const record = useRecord();
  const scope = useVariableOptions({
    collectionField: { uiSchema: fieldSchema },
    form,
    record,
    uiSchema: fieldSchema,
    noDisabled: true,
  });
  return (
    <SchemaSettingsModalItem
      title={t('Edit Link')}
      components={{ Variable, Input }}
      schema={{
        type: 'object',
        title: t('To'),
        properties: {
          to: {
            title: t('To'),
            type: 'string',
            default: fieldSchema?.['x-component-props']?.['to'],
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope,
            },
          },
        },
      }}
      onSubmit={({ to }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.to = to;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.to = to;
        console.log(componentProps);
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': componentProps,
          },
        });
        dn.refresh();
      }}
    />
  );
}

export const customizeLinkActionSettings = new SchemaSettings({
  name: 'actionSettings:link',
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
        const { name } = useCollection_deprecated();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'editLink',
      Component: SchemaSettingsActionLinkItem,
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
