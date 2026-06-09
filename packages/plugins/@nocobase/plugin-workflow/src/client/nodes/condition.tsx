/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 condition node. The metadata + config UI now live ONCE in the v2 instruction
 * (`client-v2/nodes/condition.tsx`): this class `extends` it (the allowed v1 → v2
 * direction), inheriting `title`/`type`/`group`/`icon`/`description`/`branching`/
 * `testable` and the three modern loaders (`FieldsetLoader` / `PresetFieldsetLoader`
 * / `ComponentLoader`). The legacy Formily config fields (`fieldset` / `presetFieldset`
 * / `scope` / `components`) are deliberately dropped — the v1 canvas now routes the
 * config drawer and add-node preset through the inherited loaders (see
 * `nodes/index.tsx` and `AddNodeContext.tsx`).
 *
 * Only the v1 in-canvas card render (`Component`) is kept here, since the v1 canvas
 * still renders cards with Formily/v1 contexts. It is deleted with the legacy canvas
 * at retirement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import V2ConditionInstruction from '../../client-v2/nodes/condition';
import { Branch } from '../Branch';
import { useFlowContext } from '../FlowContext';
import useStyles from '../style';
import { NodeDefaultView } from '.';

export default class extends V2ConditionInstruction {
  Component({ data }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { nodes } = useFlowContext();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { styles } = useStyles();
    const {
      id,
      config: { rejectOnFalse },
    } = data;
    const trueEntry = nodes.find((item) => item.upstreamId === id && item.branchIndex === 1);
    const falseEntry = nodes.find((item) => item.upstreamId === id && item.branchIndex === 0);
    return (
      <NodeDefaultView data={data}>
        {rejectOnFalse ? null : (
          <div className={styles.nodeSubtreeClass}>
            <div className={styles.branchBlockClass}>
              <Branch from={data} entry={falseEntry} branchIndex={0} />
              <Branch from={data} entry={trueEntry} branchIndex={1} />
            </div>
            <div className={styles.conditionClass}>
              <span style={{ right: '4em' }}>{t('No')}</span>
              <span style={{ left: '4em' }}>{t('Yes')}</span>
            </div>
          </div>
        )}
      </NodeDefaultView>
    );
  }
}
