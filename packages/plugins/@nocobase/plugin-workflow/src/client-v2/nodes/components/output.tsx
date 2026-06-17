/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { useT } from '../../locale';
import { WorkflowTypedVariableInput, WORKFLOW_TYPED_CONSTANT_TYPES } from '../../canvas/WorkflowTypedVariableInput';

export function OutputFieldset() {
  const t = useT();

  return (
    <Form.Item name={['config', 'value']} label={t('Output value')}>
      <WorkflowTypedVariableInput
        types={WORKFLOW_TYPED_CONSTANT_TYPES}
        nullable={false}
        defaultToFirstConstantTypeWhenUndefined
        placeholder={t('Input workflow result')}
      />
    </Form.Item>
  );
}
