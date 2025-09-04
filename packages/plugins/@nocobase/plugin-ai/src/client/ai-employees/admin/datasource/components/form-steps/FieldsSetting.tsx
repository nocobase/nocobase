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
import { FlowModelContext, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { CollectionCascader, FieldsTransfer } from '../basic';

export const FieldsSetting: React.FC<{
  form: FormInstance;
  name: string;
  show: boolean;
}> = ({ form, name, show }) => {
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
        label={ctx.t('Fields')}
        name="fields"
        rules={[{ required: true, message: ctx.t('Please select fields') }]}
      >
        <FieldsTransfer />
      </Form.Item>
    </Form>
  );
};
