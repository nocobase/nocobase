/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Form, FormInstance, Input } from 'antd';
import { FlowModelContext, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { FieldsTransfer } from '../basic';
import { useCollectionContext } from '../../context';

export const FieldsSetting: React.FC<{
  form: FormInstance;
  name: string;
  show: boolean;
}> = ({ form, name, show }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const currentCollection = useCollectionContext();

  return (
    <Form form={form} name={name} layout="vertical" colon={true} style={!show && { display: 'none' }}>
      <Form.Item label={ctx.t('Collection')}>
        <Input value={currentCollection.displayName} disabled />
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
