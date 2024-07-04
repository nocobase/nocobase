/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { css } from '@emotion/css';
import { ArrayItems } from '@formily/antd-v5';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionRecord, useDesignable, useFormBlockContext, useRecord } from '../../../';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsLinkageRules, SchemaSettingsModalItem } from '../../../schema-settings';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';

interface SchemaSettingsActionLinkItemProps {
  afterSubmit?: () => void;
}

export const SchemaSettingsActionLinkItem: FC<SchemaSettingsActionLinkItemProps> = ({ afterSubmit }) => {
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
      title={t('Edit link')}
      components={{ ArrayItems }}
      schema={{
        type: 'object',
        title: t('Edit link'),
        properties: {
          url: {
            title: t('URL'),
            type: 'string',
            default: fieldSchema?.['x-component-props']?.['url'],
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope,
              changeOnSelect: true,
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
                        changeOnSelect: true,
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
        console.log('componentProps', componentProps);
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
        afterSubmit?.();
      }}
    />
  );
};

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
      name: 'editLink',
      Component: SchemaSettingsActionLinkItem,
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useVisible() {
        const record = useCollectionRecord();
        return !_.isEmpty(record?.data);
      },
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
