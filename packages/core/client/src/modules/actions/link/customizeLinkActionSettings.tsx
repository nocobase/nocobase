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
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../../';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import {
  SchemaSettingsLinkageRules,
  SchemaSettingsModalItem,
  SchemaSettingAccessControl,
} from '../../../schema-settings';
import { useURLAndHTMLSchema } from './useURLAndHTMLSchema';
import { useDataBlockProps } from '../../../data-source';

export const SchemaSettingsActionLinkItem: FC = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { urlSchema, paramsSchema, openInNewWindowSchema } = useURLAndHTMLSchema();
  const componentProps = fieldSchema['x-component-props'] || {};
  const initialValues = {
    url: componentProps.url,
    params: componentProps.params || [{}],
    openInNewWindow: componentProps.openInNewWindow,
  };

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
          openInNewWindow: openInNewWindowSchema,
        },
      }}
      onSubmit={({ url, params, openInNewWindow }) => {
        componentProps.url = url;
        componentProps.params = params;
        componentProps.openInNewWindow = openInNewWindow;

        fieldSchema['x-component-props'] = componentProps;

        field.componentProps.url = url;
        field.componentProps.params = params;
        field.componentProps.openInNewWindow = openInNewWindow;

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
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        const { association } = useDataBlockProps() || {};
        const { getCollectionField } = useCollectionManager_deprecated();
        const associationField = getCollectionField(association);
        return {
          ...linkageRulesProps,
        };
      },
    },
    SchemaSettingAccessControl,
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
