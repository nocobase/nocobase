import { Switch } from '@formily/antd-v5';
import { useField } from '@formily/react';
import { GeneralSchemaDesigner, SchemaSettingsModalItem } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { useSchemaPatch } from '../../hooks';

export const HeaderDesigner = () => {
  const field = useField();
  const { onUpdateComponentProps } = useSchemaPatch();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner draggable={false}>
      <SchemaSettingsModalItem
        title={t('Edit info')}
        components={{ Switch }}
        initialValues={field.componentProps}
        schema={{
          properties: {
            title: {
              type: 'string',
              title: t('Title'),
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            showBack: {
              type: 'boolean',
              title: t('Display back button'),
              'x-component': 'Switch',
              'x-decorator': 'FormItem',
            },
          },
        }}
        onSubmit={onUpdateComponentProps}
      />
    </GeneralSchemaDesigner>
  );
};
