/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { ArrayItems } from '@formily/antd-v5';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionRecord, useDesignable } from '../../../';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsLinkageRules, SchemaSettingsModalItem } from '../../../schema-settings';
import { useURLAndParamsSchema } from './useURLAndParamsSchema';

export function SchemaSettingsActionLinkItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { urlSchema, paramsSchema } = useURLAndParamsSchema();
  const initialValues = { url: field.componentProps.url, params: field.componentProps.params || [{}] };

  return (
    <SchemaSettingsModalItem
      title={t('Edit link')}
      components={{ ArrayItems }}
      schema={{
        type: 'object',
        title: t('Edit link'),
        properties: {
          url: {
            ...urlSchema,
            required: true,
          },
          params: paramsSchema,
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
      initialValues={initialValues}
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
