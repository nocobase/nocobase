/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { evaluators } from '@nocobase/evaluators/client';
import { Form, type FormItemProps } from 'antd';
import { WorkflowVariableInput } from '../../canvas/WorkflowVariableInput';
import { CalculationConfig } from '../../components/Calculation';
import { RadioWithTooltip, type RadioWithTooltipOption } from '../../components/RadioWithTooltip';
import { renderEngineReference } from '../../components/renderEngineReference';
import { useT } from '../../locale';

export const BASIC_ENGINE = 'basic';

export type ConditionFieldPrefix = string[];

function withPrefix(prefix: ConditionFieldPrefix, name: string) {
  return [...prefix, name];
}

export function useConditionEngineOptions(): RadioWithTooltipOption[] {
  const tt = useT();
  const extras = Array.from(evaluators.getEntities())
    .filter(([key]) => ['math.js', 'formula.js'].includes(key))
    .map(([value, options]) => ({ value, label: options.label, tooltip: options.tooltip }));
  return [{ value: BASIC_ENGINE, label: tt('Basic') }, ...extras];
}

export function ConditionRuleFields({
  prefix,
  calculationLabel,
  expressionLabel,
  expressionItemProps,
}: {
  prefix: ConditionFieldPrefix;
  calculationLabel?: React.ReactNode;
  expressionLabel?: React.ReactNode;
  expressionItemProps?: Partial<FormItemProps>;
}) {
  const tt = useT();
  const engineOptions = useConditionEngineOptions();
  const engine = Form.useWatch(withPrefix(prefix, 'engine')) ?? BASIC_ENGINE;

  return (
    <>
      <Form.Item
        name={withPrefix(prefix, 'engine')}
        label={tt('Calculation engine')}
        rules={[{ required: true }]}
        initialValue={BASIC_ENGINE}
      >
        <RadioWithTooltip options={engineOptions} />
      </Form.Item>

      <Form.Item
        name={withPrefix(prefix, 'calculation')}
        label={calculationLabel ?? tt('Condition')}
        hidden={engine !== BASIC_ENGINE}
        dependencies={[withPrefix(prefix, 'engine')]}
        rules={[{ required: engine === BASIC_ENGINE }]}
      >
        <CalculationConfig />
      </Form.Item>

      <Form.Item
        name={withPrefix(prefix, 'expression')}
        label={expressionLabel ?? tt('Condition expression')}
        hidden={engine === BASIC_ENGINE}
        dependencies={[withPrefix(prefix, 'engine')]}
        validateTrigger={['onChange', 'onBlur']}
        rules={[
          { required: engine !== BASIC_ENGINE },
          {
            validator: async (_rule, value) => {
              if (engine === BASIC_ENGINE || !value) {
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
                throw new Error(tt('Expression syntax error'));
              }
            },
          },
        ]}
        extra={engine === BASIC_ENGINE ? undefined : renderEngineReference(engine, tt)}
        {...expressionItemProps}
      >
        <WorkflowVariableInput />
      </Form.Item>
    </>
  );
}
