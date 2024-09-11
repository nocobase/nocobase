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
import { SchemaSettingsModalItem, useURLAndHTMLSchema } from '@nocobase/client';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useMobileRoutes } from '../../../../mobile-providers/context/MobileRoutes';

export const SchemaSettingsActionLinkItem: FC = () => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { urlSchema, paramsSchema, openInNewWindowSchema } = useURLAndHTMLSchema();
  const { resource, refresh } = useMobileRoutes();
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
      onSubmit={async ({ url, params, openInNewWindow }) => {
        const schema = fieldSchema.toJSON();
        const id = Number(schema.name);
        await resource.update({
          filterByTk: id,
          values: { options: { ...schema['x-component-props'], url, params, openInNewWindow } },
        });
        refresh();
      }}
      initialValues={initialValues}
    />
  );
};
