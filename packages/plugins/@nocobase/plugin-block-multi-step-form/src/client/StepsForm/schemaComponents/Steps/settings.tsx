/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { useT } from '../../../locale';
import { useStepsFormContext } from '../context';
import { ISchema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettingsModalItem, SchemaSettingsItem } from '@nocobase/client';

function SchemaSettingsStepTitleItem() {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const ctx = useStepsFormContext();
  return (
    <SchemaSettingsModalItem
      title={t('Edit')}
      schema={
        {
          type: 'object',
          title: t('Edit'),
          properties: {
            title: {
              title: t('Title'),
              type: 'string',
              default: fieldSchema?.['x-content'],
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        } as ISchema
      }
      onSubmit={({ title }) => {
        ctx.changeStepTitle(fieldSchema.name as string, title);
      }}
    />
  );
}

function SchemaSettingDeleteItem() {
  const t = useT();
  const ctx = useStepsFormContext();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaSettingsItem
      title={t('Delete')}
      onClick={() => {
        ctx.deleteStep(fieldSchema.name as string);
      }}
    />
  );
}

export const stepsFormStepTitleSettings: any = new SchemaSettings({
  name: `settings:stepsFormStepTitleSettings`,
  items: [
    {
      name: 'SchemaSettingsStepTitleItem',
      Component: SchemaSettingsStepTitleItem,
    },
    {
      name: 'SchemaSettingDeleteItem',
      Component: SchemaSettingDeleteItem,
    },
  ],
});
