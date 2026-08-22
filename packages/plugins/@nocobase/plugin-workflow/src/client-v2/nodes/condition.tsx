/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2 condition node — the modern-canvas counterpart of v1's
 * `client/nodes/condition.tsx`. This file holds ONLY the lightweight
 * `Instruction` (static metadata + loaders); its lazily-loaded UI lives in
 * `nodes/components/condition.tsx`, so the loaders are real code-split chunks
 * (the form / preset / canvas render load on demand, not with registration).
 *
 * This is the reference layout for core nodes: `nodes/<type>.tsx` = Instruction,
 * `nodes/components/<type>.tsx` = its lazily-loaded components.
 */

import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

const BRANCH_INDEX = {
  ON_TRUE: 1,
  ON_FALSE: 0,
} as const;

export default class extends Instruction {
  type = 'condition';
  title = t('Condition');
  group = 'control';
  // Inline single-quote `{{t('…')}}` template (mirrors v1's `condition.tsx`): the text contains inner double-quotes, so
  // the key must be single-quoted to avoid terminating the template early. `useT()` expands it in the drawer.
  description = `{{t('Based on boolean result of the calculation to determine whether to "continue" or "exit" the process, or continue on different branches of "yes" and "no".', { ns: "${NAMESPACE}" })}}`;
  icon = (<QuestionCircleOutlined />);
  testable = true;
  // Branch into "Yes"/"No" when not in reject-on-false mode (mirrors v1).
  branching = ({ rejectOnFalse = true } = {}) =>
    rejectOnFalse
      ? false
      : [
          { label: t('Yes'), value: BRANCH_INDEX.ON_TRUE },
          { label: t('No'), value: BRANCH_INDEX.ON_FALSE },
        ];
  // Modern canvas extension points (doc §9.5): config drawer form, add-time preset (mode picker), and the in-canvas
  // render with Yes/No branch subtrees. The lazily-loaded components live in `./components/condition`; the loaders wrap
  // its named exports as `{ default }` for `React.lazy`.
  //
  // No `createDefaultConfig` (matching v1's condition): initial values come from the Form.Item `initialValue`s —
  // `rejectOnFalse` from the add-time preset form, `engine` from the config drawer — the antd equivalent of v1's
  // Formily schema `default` props.
  FieldsetLoader = () => import('./components/condition').then((m) => ({ default: m.ConditionFieldset }));
  PresetFieldsetLoader = () => import('./components/condition').then((m) => ({ default: m.ConditionPresetFieldset }));
  ComponentLoader = () => import('./components/condition').then((m) => ({ default: m.ConditionCanvasComponent }));
}
