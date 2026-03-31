/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsSwitchItem,
  useDesignable,
  useToken,
} from '@nocobase/client';
import React from 'react';
import { useChartsTranslation } from '../locale';
import { useField, useFieldSchema } from '@formily/react';

/**
 * @deprecated
 * use `chartBlockSettings` instead
 */

export const ChartV2BlockDesigner: React.FC = () => {
  const { t } = useChartsTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { token } = useToken();

  return (
    <GeneralSchemaDesigner title={t('Charts')} showDataSource={false}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsSwitchItem
        title={t('Show background')}
        checked={field.componentProps.style?.background !== 'none'}
        onChange={(v) => {
          const style = {
            ...field.componentProps.style,
            background: v ? token.colorBgContainer : 'none',
            boxShadow: v ? token.boxShadowTertiary : 'none',
          };
          field.componentProps.style = style;
          field.componentProps.bordered = v;
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettingsSwitchItem
        title={t('Show padding')}
        checked={field.componentProps.bodyStyle?.padding !== '5px 0 0'}
        onChange={(v) => {
          const style = {
            ...field.componentProps.bodyStyle,
            padding: v ? `${token.paddingLG}px ${token.paddingLG}px 0` : '5px 0 0',
          };
          field.componentProps.bodyStyle = style;
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
