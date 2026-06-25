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
import { evaluators, getOptions } from '@nocobase/evaluators/client';
import { RadioWithTooltip } from '../../components/RadioWithTooltip';
import { renderEngineReference } from '../../components/renderEngineReference';
import { WorkflowVariableInput } from '../../canvas/WorkflowVariableInput';
import { useT } from '../../locale';

export function CalculationFieldset() {
  const t = useT();
  const engine = Form.useWatch(['config', 'engine']) ?? 'formula.js';

  return (
    <>
      <Form.Item
        name={['config', 'engine']}
        label={t('Calculation engine')}
        rules={[{ required: true }]}
        initialValue="formula.js"
      >
        <RadioWithTooltip options={getOptions()} />
      </Form.Item>

      <Form.Item
        name={['config', 'expression']}
        label={t('Calculation expression')}
        dependencies={[['config', 'engine']]}
        validateTrigger={['onChange', 'onBlur']}
        rules={[
          { required: true },
          {
            validator: async (_rule, value) => {
              if (!value) {
                return;
              }
              const evaluator = evaluators.get(engine);
              if (!evaluator) {
                return;
              }
              const exp = String(value)
                .trim()
                .replace(/{{([^{}]+)}}/g, ' "1" ');
              try {
                evaluator.evaluate(exp);
              } catch (error) {
                throw new Error(t('Expression syntax error'));
              }
            },
          },
        ]}
        extra={renderEngineReference(engine, t)}
      >
        <WorkflowVariableInput />
      </Form.Item>
    </>
  );
}

export default CalculationFieldset;
