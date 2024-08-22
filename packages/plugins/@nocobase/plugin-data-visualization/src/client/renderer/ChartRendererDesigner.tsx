/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  gridRowColWrap,
  useCollection_deprecated,
  useDataSource,
  useDesignable,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure';
import { useChartsTranslation } from '../locale';
import { createRendererSchema } from '../utils';
import { ChartRendererContext } from './ChartRendererProvider';
import { ChartDataContext } from '../block/ChartDataProvider';

export const SchemaSettingsAutoRefresh: React.FC = () => {
  const { t } = useChartsTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  return (
    <SchemaSettingsSelectItem
      title={t('Auto refresh')}
      value={field.decoratorProps?.config?.autoRefresh || false}
      onChange={(v) => {
        const config = {
          ...field.decoratorProps?.config,
          autoRefresh: v,
        };
        field.decoratorProps.config = config;
        fieldSchema['x-decorator-props'] = field.decoratorProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': field.decoratorProps,
          },
        });
        dn.refresh();
      }}
      options={[
        {
          label: t('Off'),
          value: false,
        },
        {
          label: '5s',
          value: 5,
        },
        {
          label: '10s',
          value: 10,
        },
        {
          label: '30s',
          value: 30,
        },
        {
          label: '1m',
          value: 60,
        },
        {
          label: '5m',
          value: 300,
        },
        {
          label: '15m',
          value: 900,
        },
        {
          label: '30m',
          value: 1800,
        },
        {
          label: '1h',
          value: 3600,
        },
        {
          label: '2h',
          value: 7200,
        },
        {
          label: '1d',
          value: 86400,
        },
      ]}
    />
  );
};

export function ChartRendererDesigner() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const { removeChart } = useContext(ChartDataContext);
  const { service } = useContext(ChartRendererContext);
  const field = useField();
  const schema = useFieldSchema();
  const { insertAdjacent } = useDesignable();
  const dataSource = useDataSource();
  const { name, title } = useCollection_deprecated();
  return (
    <GeneralSchemaDesigner disableInitializer title={title || name}>
      <SchemaSettingsItem
        title="Configure"
        key="configure"
        onClick={async () => {
          setCurrent({ schema, field, dataSource: dataSource.key, collection: name, service, data: service.data });
          setVisible(true);
        }}
      >
        {t('Configure')}
      </SchemaSettingsItem>
      <SchemaSettingsItem
        title="Duplicate"
        key="duplicate"
        onClick={() => insertAdjacent('afterEnd', gridRowColWrap(createRendererSchema(schema?.['x-decorator-props'])))}
      >
        {t('Duplicate')}
      </SchemaSettingsItem>
      <SchemaSettingsAutoRefresh />
      {/* <SchemaSettingsBlockTitleItem /> */}
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        // removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ChartV2Block',
        }}
        confirm={{
          onOk: () => {
            removeChart(schema['x-uid']);
          },
        }}
      />
    </GeneralSchemaDesigner>
  );
}
