/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { useField, useFieldSchema } from '@formily/react';
import {
  SchemaSettings,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  gridRowColWrap,
  useDataSource,
  useCollection,
  useDesignable,
} from '@nocobase/client';
import { ChartDataContext } from '../block/ChartDataProvider';
import { ChartConfigContext } from '../configure';
import { useChartsTranslation } from '../locale';
import { createRendererSchema } from '../utils';
import { ChartRendererContext } from '../renderer/ChartRendererProvider';

export const chartRendererSettings = new SchemaSettings({
  name: 'chart:renderer',
  items: [
    {
      name: 'configure',
      Component: () => {
        const { t } = useChartsTranslation();
        const { setVisible, setCurrent } = useContext(ChartConfigContext);
        const { service } = useContext(ChartRendererContext);
        const field = useField();
        const schema = useFieldSchema();
        const dataSource = useDataSource();
        const { name } = useCollection();

        return (
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
        );
      },
    },
    {
      name: 'duplicate',
      Component: () => {
        const { t } = useChartsTranslation();
        const { insertAdjacent, refresh } = useDesignable();
        const schema = useFieldSchema();

        return (
          <SchemaSettingsItem
            title="Duplicate"
            key="duplicate"
            onClick={() => {
              insertAdjacent('afterEnd', gridRowColWrap(createRendererSchema(schema?.['x-decorator-props'])));
              refresh({ refreshParentSchema: true });
            }}
          >
            {t('Duplicate')}
          </SchemaSettingsItem>
        );
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      Component: () => {
        const { removeChart } = useContext(ChartDataContext);
        const schema = useFieldSchema();

        return (
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
        );
      },
    },
  ],
});
