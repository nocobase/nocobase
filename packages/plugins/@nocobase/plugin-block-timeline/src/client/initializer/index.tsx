/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useState } from 'react';
import { FieldTimeOutlined } from '@ant-design/icons';
import { DataBlockInitializer, SchemaInitializerItemType, useSchemaInitializer } from '@nocobase/client';

import { getTimelineSchema } from '../schema';
import { useT } from '../locale';
import { TimelineConfigFormProps, TimelineInitializerConfigForm } from './ConfigForm';
import { BlockName, BlockNameLowercase } from '../constants';

export const TimelineInitializerComponent = () => {
  const { insert } = useSchemaInitializer();
  const [collection, setCollection] = useState<string>();
  const [dataSource, setDataSource] = useState<string>();
  const [showConfigForm, setShowConfigForm] = useState(false);
  const t = useT();

  const onSubmit: TimelineConfigFormProps['onSubmit'] = useCallback(
    (values) => {
      const schema = getTimelineSchema({
        collection,
        dataSource,
        timeField: values.timeField,
        titleField: values.titleField,
        colorField: values.colorField,
      });
      insert(schema);
    },
    [collection, dataSource],
  );

  return (
    <>
      {showConfigForm && (
        <TimelineInitializerConfigForm
          visible={showConfigForm}
          setVisible={setShowConfigForm}
          onSubmit={onSubmit}
          collection={collection}
          dataSource={dataSource}
        />
      )}
      <DataBlockInitializer
        name={BlockNameLowercase}
        title={t(BlockName)}
        icon={<FieldTimeOutlined />}
        componentType={BlockName}
        onCreateBlockSchema={({ item }) => {
          const { name: collection, dataSource } = item;
          setCollection(collection);
          setDataSource(dataSource);
          setShowConfigForm(true);
        }}
      ></DataBlockInitializer>
    </>
  );
};

export const timelineInitializerItem: SchemaInitializerItemType = {
  name: 'Timeline',
  Component: TimelineInitializerComponent,
};

export * from './configureActions';
