/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Lazy-loaded UI for the condition node, kept in a SEPARATE module from the
 * Instruction (`nodes/condition.tsx`) so the Instruction's loaders
 * (`() => import('./components/condition')`) are genuine code-split chunks — the
 * config-drawer form, the add-time preset, and the in-canvas render only load
 * when actually opened, never with the lightweight Instruction registration.
 *
 * This is the reference layout for node components: a node's `Instruction` lives
 * in `nodes/<type>.tsx`; its lazily-loaded components live in
 * `nodes/components/<type>.tsx` and are pulled in via the Instruction's loaders.
 */

import React from 'react';
import { evaluators } from '@nocobase/evaluators/client';
import { Form, Radio } from 'antd';

import { Branch } from '../../canvas/Branch';
import { NodeDefaultView } from '../../canvas/Node';
import { useFlowContext } from '../../canvas/contexts';
import { WorkflowVariableInput } from '../../canvas/WorkflowVariableInput';
import useStyles from '../../canvas/style';
import { CalculationConfig } from '../../components/Calculation';
import { RadioWithTooltip, type RadioWithTooltipOption } from '../../components/RadioWithTooltip';
import { renderEngineReference } from '../../components/renderEngineReference';
import { useT } from '../../locale';

const BASIC_ENGINE = 'basic';

const BRANCH_INDEX = {
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

// —— Config-drawer form (`FieldsetLoader`) ——————————————————————————————————

function useEngineOptions(): RadioWithTooltipOption[] {
  const tt = useT();
  const extras = Array.from(evaluators.getEntities())
    .filter(([key]) => ['math.js', 'formula.js'].includes(key))
    .map(([value, options]) => ({ value, label: options.label, tooltip: options.tooltip }));
  return [{ value: BASIC_ENGINE, label: tt('Basic') }, ...extras];
}

export function ConditionFieldset() {
  const tt = useT();
  const engineOptions = useEngineOptions();
  // Drives the calculation/expression visibility + the expression validator.
  const engine = Form.useWatch(['config', 'engine']) ?? BASIC_ENGINE;

  return (
    <>
      <Form.Item name={['config', 'rejectOnFalse']} label={tt('Mode')}>
        <Radio.Group
          disabled
          options={[
            { value: true, label: tt('Continue when "Yes"') },
            { value: false, label: tt('Branch into "Yes" and "No"') },
          ]}
        />
      </Form.Item>

      <Form.Item
        name={['config', 'engine']}
        label={tt('Calculation engine')}
        rules={[{ required: true }]}
        initialValue={BASIC_ENGINE}
      >
        <RadioWithTooltip options={engineOptions} />
      </Form.Item>

      {/* Both fields stay mounted; visibility is toggled with `hidden` (not
          conditional render) so antd keeps each Form.Item's value + validation
          state across engine switches — the v1 `x-reactions` visible behaviour,
          where the model (and its error) persists while the DOM hides.

          The `rules` are kept STABLE (not toggled by engine) and each rule
          no-ops for the inactive engine instead — toggling `rules` to `[]` when
          hidden clears the field's error, and antd does not re-validate on the
          way back, so the error would not reappear (characterized in
          `nodes/__tests__/conditionFieldsetValidation.test.tsx`). `dependencies`
          re-runs the validators when the engine changes, so the error reappears
          on its own. */}
      <Form.Item
        name={['config', 'calculation']}
        label={tt('Condition')}
        hidden={engine !== BASIC_ENGINE}
        dependencies={[['config', 'engine']]}
        rules={[{ required: engine === BASIC_ENGINE }]}
      >
        <CalculationConfig />
      </Form.Item>

      <Form.Item
        name={['config', 'expression']}
        label={tt('Condition expression')}
        hidden={engine === BASIC_ENGINE}
        dependencies={[['config', 'engine']]}
        validateTrigger={['onChange', 'onBlur']}
        rules={[
          { required: engine !== BASIC_ENGINE },
          {
            validator: async (_rule, value) => {
              // No-op for the basic engine (the expression field is unused/hidden then) — keeps the rule array stable
              // so the error survives the round-trip rather than being cleared.
              if (engine === BASIC_ENGINE || !value) {
                return;
              }
              const evaluator = evaluators.get(engine);
              if (!evaluator) {
                return;
              }
              // Replace every `{{ var }}` with a dummy literal so only the surrounding expression syntax is validated
              // (mirrors v1).
              const exp = String(value)
                .trim()
                .replace(/{{([^{}]+)}}/g, ' "1" ');
              try {
                evaluator.evaluate(exp);
              } catch (err) {
                throw new Error(tt('Expression syntax error'));
              }
            },
          },
        ]}
        extra={engine === BASIC_ENGINE ? undefined : renderEngineReference(engine, tt)}
      >
        <WorkflowVariableInput />
      </Form.Item>
    </>
  );
}

// —— Add-time preset form (`PresetFieldsetLoader`) ——————————————————————————

export function ConditionPresetFieldset() {
  const tt = useT();
  return (
    <Form.Item name={['config', 'rejectOnFalse']} label={tt('Mode')} rules={[{ required: true }]} initialValue={true}>
      <Radio.Group
        options={[
          { value: true, label: tt('Continue when "Yes"') },
          { value: false, label: tt('Branch into "Yes" and "No"') },
        ]}
      />
    </Form.Item>
  );
}

// —— In-canvas render (`ComponentLoader`) ———————————————————————————————————

export function ConditionCanvasComponent({ data }: { data: any }) {
  const tt = useT();
  const { styles } = useStyles();
  const { nodes } = useFlowContext() ?? {};
  const { id, config: { rejectOnFalse } = {} as any } = data;

  const trueEntry = (nodes ?? []).find(
    (item: any) => item.upstreamId === id && item.branchIndex === BRANCH_INDEX.ON_TRUE,
  );
  const falseEntry = (nodes ?? []).find(
    (item: any) => item.upstreamId === id && item.branchIndex === BRANCH_INDEX.ON_FALSE,
  );

  return (
    <NodeDefaultView data={data}>
      {rejectOnFalse ? null : (
        <div className={styles.nodeSubtreeClass}>
          <div className={styles.branchBlockClass}>
            <Branch from={data} entry={falseEntry} branchIndex={BRANCH_INDEX.ON_FALSE} />
            <Branch from={data} entry={trueEntry} branchIndex={BRANCH_INDEX.ON_TRUE} />
          </div>
          <div className={styles.conditionClass}>
            <span style={{ right: '4em' }}>{tt('No')}</span>
            <span style={{ left: '4em' }}>{tt('Yes')}</span>
          </div>
        </div>
      )}
    </NodeDefaultView>
  );
}
