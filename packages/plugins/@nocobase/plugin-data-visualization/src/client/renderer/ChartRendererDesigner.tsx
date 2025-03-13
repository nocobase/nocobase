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
  gridRowColWrap,
  useCollection_deprecated,
  useDataSource,
  useDesignable,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { ChartConfigContext } from '../configure';
import { useChartsTranslation } from '../locale';
import { createRendererSchema } from '../utils';
import { ChartRendererContext } from './ChartRendererProvider';

/**
 * @deprecated
 * use `chartRendererSettings` instead
 */
export function ChartRendererDesigner() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const { removeChart } = useContext(ChartDataContext);
  const { service } = useContext(ChartRendererContext);
  const field = useField();
  const schema = useFieldSchema();
  const { insertAdjacent, refresh } = useDesignable();
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
        onClick={() => {
          insertAdjacent('afterEnd', gridRowColWrap(createRendererSchema(schema?.['x-decorator-props'])));
          refresh({ refreshParentSchema: true });
        }}
      >
        {t('Duplicate')}
      </SchemaSettingsItem>
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
