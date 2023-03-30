import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../schema-settings';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { useDesignable } from '../schema-component';

interface Options {
  openMode?: boolean;
  openSize?: boolean;
}
export const OpenModeSchemaItems: React.FC<Options> = (options) => {
  const { openMode = true, openSize = true } = options;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const openModeValue = fieldSchema?.['x-component-props']?.['openMode'] || 'drawer';

  return (
    <>
      {openMode ? (
        <SchemaSettings.SelectItem
          title={t('Open mode')}
          options={[
            { label: t('Drawer'), value: 'drawer' },
            { label: t('Dialog'), value: 'modal' },
          ]}
          value={openModeValue}
          onChange={(value) => {
            field.componentProps.openMode = value;
            fieldSchema['x-component-props'] = field.componentProps;

            // when openMode change, set openSize value to default
            Reflect.deleteProperty(fieldSchema['x-component-props'], 'openSize');
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          }}
        />
      ) : null}
      {openSize && ['modal', 'drawer'].includes(openModeValue) ? (
        <SchemaSettings.Item>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            {t('Popup size')}
            <Select
              bordered={false}
              options={[
                { label: t('Small'), value: 'small' },
                { label: t('Middle'), value: 'middle' },
                { label: t('Large'), value: 'large' },
              ]}
              value={
                fieldSchema?.['x-component-props']?.['openSize'] ??
                (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle')
              }
              onChange={(value) => {
                field.componentProps.openSize = value;
                fieldSchema['x-component-props'] = field.componentProps;
                dn.emit('patch', {
                  schema: {
                    'x-uid': fieldSchema['x-uid'],
                    'x-component-props': fieldSchema['x-component-props'],
                  },
                });
                dn.refresh();
              }}
              style={{ textAlign: 'right', minWidth: 100 }}
            />
          </div>
        </SchemaSettings.Item>
      ) : null}
    </>
  );
};
