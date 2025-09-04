/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, FormInstance } from 'antd';
import { FlowModelContext, MultiRecordResource, observer, useFlowContext } from '@nocobase/flow-engine';
import { CollectionCascader } from '../basic';
import { ContextFilterItem, FilterGroup, FilterGroupType } from '@nocobase/client';

const Filter: React.FC<{
  value: any;
}> = observer(({ value }) => {
  const ctx = useFlowContext();
  return <FilterGroup value={value} FilterItem={(props) => <ContextFilterItem {...props} model={ctx.model} />} />;
});

export const FilterSetting: React.FC<{
  form: FormInstance;
  dataScope: FilterGroupType;
  name: string;
  show: boolean;
}> = ({ form, dataScope, name, show }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();

  return (
    <Form form={form} name={name} layout="vertical" colon={true} style={!show && { display: 'none' }}>
      <Form.Item
        required={false}
        label={ctx.t('Collection')}
        name="collection"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <CollectionCascader disabled={true} />
      </Form.Item>
      <Form.Item
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Filter value={dataScope} />
      </Form.Item>
    </Form>
  );
};
