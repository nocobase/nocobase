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
import { css } from '@emotion/css';
import { ArrayItems } from '@formily/antd-v5';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { useTranslation } from 'react-i18next';
import { SchemaSettingsLinkageRules, SchemaSettingsModalItem } from '../../../schema-settings';
import { useDesignable, useFormBlockContext, useRecord } from '../../../';
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
      components={{ ArrayItems }}
      schema={{
        type: 'object',
        title: t('Edit Link'),
        properties: {
          url: {
            title: t('URL'),
            type: 'string',
            default: fieldSchema?.['x-component-props']?.['url'],
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope,
            },
            description: t('Do not concatenate search params in the URL'),
          },
          params: {
            type: 'array',
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            title: `{{t("Search parameters")}}`,
            default: fieldSchema?.['x-component-props']?.params || [{}],
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    style: {
                      flexWrap: 'nowrap',
                      maxWidth: '100%',
                    },
                    className: css`
                      & > .ant-space-item:first-child,
                      & > .ant-space-item:last-child {
                        flex-shrink: 0;
                      }
                    `,
                  },
                  properties: {
                    name: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: `{{t("Name")}}`,
                      },
                    },
                    value: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Variable.TextArea',
                      'x-component-props': {
                        scope,
                        placeholder: `{{t("Value")}}`,
                        useTypedConstant: true,
                      },
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add parameter")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
        },
      }}
      onSubmit={({ url, params }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.url = url;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.url = url;
        componentProps.params = params;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.params = params;
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
