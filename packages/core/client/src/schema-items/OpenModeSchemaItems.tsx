/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema, Schema } from '@formily/react';
import { Select } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializerItem, SchemaInitializerSelect } from '../application';
import { useDesignable } from '../schema-component';
import { usePopupSettings } from '../schema-component/antd/page/PopupSettingsProvider';
import { SchemaSettingsSelectItem } from '../schema-settings';

interface Options {
  openMode?: boolean;
  openSize?: boolean;
  modeOptions?: { label: string; value: string }[];
  targetSchema?: Schema;
}
export const SchemaInitializerOpenModeSchemaItems: React.FC<Options> = (options) => {
  const { openMode = true, openSize = true } = options;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const openModeValue = fieldSchema?.['x-component-props']?.['openMode'] || 'drawer';
  const modeOptions = useMemo(() => {
    if (isPopupVisibleControlledByURL()) {
      return [
        { label: t('Drawer'), value: 'drawer' },
        { label: t('Dialog'), value: 'modal' },
        { label: t('Page'), value: 'page' },
      ];
    }

    return [
      { label: t('Drawer'), value: 'drawer' },
      { label: t('Dialog'), value: 'modal' },
    ];
  }, [t, isPopupVisibleControlledByURL()]);

  return (
    <>
      {openMode ? (
        <SchemaInitializerSelect
          closeInitializerMenuWhenClick={false}
          title={t('Open mode')}
          options={modeOptions}
          value={openModeValue}
          onChange={(value) => {
            field.componentProps.openMode = value;
            const schema = {
              'x-uid': fieldSchema['x-uid'],
            };
            schema['x-component-props'] = fieldSchema['x-component-props'] || {};
            schema['x-component-props'].openMode = value;
            fieldSchema['x-component-props'].openMode = value;
            // when openMode change, set openSize value to default
            Reflect.deleteProperty(fieldSchema['x-component-props'], 'openSize');
            dn.emit('patch', {
              schema: schema,
            });
            dn.refresh();
          }}
        />
      ) : null}
      {openSize && ['modal', 'drawer'].includes(openModeValue) ? (
        <SchemaInitializerItem closeInitializerMenuWhenClick={false}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            {t('Popup size')}
            <Select
              data-testid="antd-select"
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
                const schema = {
                  'x-uid': fieldSchema['x-uid'],
                };
                schema['x-component-props'] = fieldSchema['x-component-props'] || {};
                schema['x-component-props'].openSize = value;
                fieldSchema['x-component-props'].openSize = value;
                dn.emit('patch', {
                  schema: schema,
                });
                dn.refresh();
              }}
              style={{ textAlign: 'right', minWidth: 100 }}
            />
          </div>
        </SchemaInitializerItem>
      ) : null}
    </>
  );
};

export const SchemaSettingOpenModeSchemaItems: React.FC<Options> = (props) => {
  const { openMode = true, openSize = true, modeOptions, targetSchema } = props;
  const currentFieldSchema = useFieldSchema();
  const fieldSchema = targetSchema || currentFieldSchema;
  const field = useField();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const openModeValue = fieldSchema?.['x-component-props']?.['openMode'] || 'drawer';

  const _modeOptions = useMemo(() => {
    if (modeOptions) {
      return modeOptions;
    }

    return [
      { label: t('Drawer'), value: 'drawer' },
      { label: t('Dialog'), value: 'modal' },
      { label: t('Page'), value: 'page' },
    ];
  }, [modeOptions, t]);

  return (
    <>
      {openMode ? (
        <SchemaSettingsSelectItem
          title={t('Open mode')}
          options={_modeOptions}
          value={openModeValue}
          onChange={(value) => {
            field.componentProps.openMode = value;
            const schema = {
              'x-uid': fieldSchema['x-uid'],
            };
            schema['x-component-props'] = fieldSchema['x-component-props'] || {};
            schema['x-component-props'].openMode = value;
            fieldSchema['x-component-props'].openMode = value;
            // when openMode change, set openSize value to default
            Reflect.deleteProperty(fieldSchema['x-component-props'], 'openSize');
            dn.emit('patch', {
              schema: schema,
            });
            dn.refresh();
          }}
        />
      ) : null}
      {openSize && ['modal', 'drawer'].includes(openModeValue) ? (
        <SchemaSettingsSelectItem
          title={t('Popup size')}
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
            const schema = {
              'x-uid': fieldSchema['x-uid'],
            };
            schema['x-component-props'] = fieldSchema['x-component-props'] || {};
            schema['x-component-props'].openSize = value;
            fieldSchema['x-component-props'].openSize = value;
            dn.emit('patch', {
              schema: schema,
            });
            dn.refresh();
          }}
        />
      ) : null}
    </>
  );
};
