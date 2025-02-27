/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { useFieldSchema } from '@formily/react';
import {
  Action,
  SchemaSettings,
  SchemaSettingsActionModalItem,
  actionSettingsItems,
  useCollection_deprecated,
  useDataSourceKey,
  useDesignable,
  SchemaSettingAccessControl,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { useCustomRequestVariableOptions, useGetCustomRequest } from '../hooks';
import { useCustomRequestsResource } from '../hooks/useCustomRequestsResource';
import { useTranslation } from '../locale';
import { CustomRequestConfigurationFieldsSchema } from '../schemas';

export function CustomRequestSettingsItem() {
  const { t } = useTranslation();
  const { name } = useCollection_deprecated();
  const dataSourceKey = useDataSourceKey();
  const fieldSchema = useFieldSchema();
  const customRequestsResource = useCustomRequestsResource();
  const { data, refresh } = useGetCustomRequest();
  const { dn } = useDesignable();
  const initialValues = useMemo(() => {
    const values = { ...data?.data?.options };
    if (values.data && typeof values.data !== 'string') {
      values.data = JSON.stringify(values.data, null, 2);
    }
    return values;
  }, [data?.data?.options]);
  return (
    <>
      <SchemaSettingsActionModalItem
        title={t('Request settings')}
        components={{
          ArrayItems,
        }}
        beforeOpen={() => !data && refresh()}
        scope={{ useCustomRequestVariableOptions }}
        schema={CustomRequestConfigurationFieldsSchema}
        initialValues={initialValues}
        onSubmit={async (config) => {
          const { ...requestSettings } = config;
          fieldSchema['x-response-type'] = requestSettings.responseType;
          const isSelfRequest =
            !fieldSchema['x-custom-request-id'] || fieldSchema['x-custom-request-id'] === fieldSchema['x-uid'];

          await customRequestsResource.updateOrCreate({
            values: {
              key: fieldSchema['x-uid'],
              options: {
                ...requestSettings,
                collectionName: name,
                dataSourceKey,
              },
            },
            filterKeys: ['key'],
          });
          const schema = {
            'x-response-type': requestSettings.responseType,
            'x-uid': fieldSchema['x-uid'],
          };
          if (!isSelfRequest && fieldSchema['x-custom-request-id']) {
            schema['x-custom-request-id'] = fieldSchema['x-uid'];
            fieldSchema['x-custom-request-id'] = fieldSchema['x-uid'];
          }
          await dn.emit('patch', {
            schema,
          });
          dn.refresh();
          refresh();
        }}
      />
    </>
  );
}

/**
 * @deprecated
 */
export const customRequestActionSettings = new SchemaSettings({
  name: 'CustomRequestActionSettings',
  items: [
    {
      ...actionSettingsItems[0],
      children: [
        ...actionSettingsItems[0].children,
        {
          name: 'request settings',
          Component: CustomRequestSettingsItem,
        },
        SchemaSettingAccessControl,
      ],
    },
  ],
});

/**
 * @deprecated
 */
export const CustomRequestActionDesigner: React.FC = () => {
  const customRequestsResource = useCustomRequestsResource();
  const fieldSchema = useFieldSchema();
  return (
    <Action.Designer
      linkageAction
      schemaSettings="CustomRequestActionSettings"
      buttonEditorProps={{
        isLink: fieldSchema['x-action'] === 'customize:table:request',
      }}
      linkageRulesProps={{
        type: 'button',
      }}
      removeButtonProps={{
        onConfirmOk() {
          return customRequestsResource.destroy({
            filterByTk: fieldSchema['x-uid'],
          });
        },
      }}
    ></Action.Designer>
  );
};
