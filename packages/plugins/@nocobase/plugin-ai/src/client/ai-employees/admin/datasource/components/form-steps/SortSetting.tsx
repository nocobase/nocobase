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

export const SortSetting: React.FC<{
  form: FormInstance;
  name: string;
  show: boolean;
}> = ({ form, name, show }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();

  return (
    <Form form={form} name={name} layout="vertical" colon={true} style={!show && { display: 'none' }}>
      <span>SortSetting</span>
    </Form>
  );
};
