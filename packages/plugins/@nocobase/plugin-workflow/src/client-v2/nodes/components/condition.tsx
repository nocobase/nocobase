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
import { Form, Radio } from 'antd';

import { Branch } from '../../canvas/Branch';
import { NodeDefaultView } from '../../canvas/Node';
import { useFlowContext } from '../../canvas/contexts';
import useStyles from '../../canvas/style';
import { ConditionRuleFields } from './conditionShared';
import { useT } from '../../locale';

const BRANCH_INDEX = {
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

export function ConditionFieldset() {
  const tt = useT();

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

      <ConditionRuleFields prefix={['config']} />
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
