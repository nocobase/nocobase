/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Form, FormInstance, Input } from 'antd';
import {
  createCollectionContextMeta,
  FlowModelContext,
  MultiRecordResource,
  observer,
  useFlowContext,
} from '@nocobase/flow-engine';
import { FilterGroupType } from '@nocobase/utils/client';
import { VariableFilterItem, FilterGroup } from '@nocobase/client';
import { useCollectionContext } from '../../context';

const Filter: React.FC<{
  value: any;
}> = observer(({ value }) => {
  const ctx = useFlowContext();
  const currentCollection = useCollectionContext();

  useEffect(() => {
    if (currentCollection.collection) {
      ctx.model.context.defineProperty('collection', {
        get: () => currentCollection.collection,
        meta: createCollectionContextMeta(() => currentCollection.collection, ctx.t('Current collection')),
      });
    }
  }, [ctx, currentCollection]);

  return <FilterGroup value={value} FilterItem={(props) => <VariableFilterItem {...props} model={ctx.model} />} />;
});

export const FilterSetting: React.FC<{
  form: FormInstance;
  dataScope: FilterGroupType;
  name: string;
  show: boolean;
}> = ({ form, dataScope, name, show }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const currentCollection = useCollectionContext();

  return (
    <Form form={form} name={name} layout="vertical" colon={true} style={!show && { display: 'none' }}>
      <Form.Item label={ctx.t('Collection')}>
        <Input value={currentCollection.displayName} disabled />
      </Form.Item>
      <Form.Item label={ctx.t('Filter group')}>
        <Filter value={dataScope} />
      </Form.Item>
    </Form>
  );
};
