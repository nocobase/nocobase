/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ClusterOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';
import { MULTI_CONDITION_BRANCH_INDEX, createEmptyMultiCondition } from './components/multiConditionsShared';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'multi-conditions';
  title = t('Multi conditions');
  group = 'control';
  description = `{{t('From left to right, attempt each branch sequentially based on the configured conditions. Only branches that meet the conditions will be executed. Otherwise, the next branch will be attempted. If none of the branches meet the conditions, it can either exit the process or continue to the next node based on configuration.', { ns: "${NAMESPACE}" })}}`;
  icon = (<ClusterOutlined />);
  branching = [
    {
      label: t('First condition'),
      value: MULTI_CONDITION_BRANCH_INDEX.DEFAULT,
    },
    {
      label: t('Otherwise'),
      value: MULTI_CONDITION_BRANCH_INDEX.OTHERWISE,
    },
  ];
  FieldsetLoader = () => import('./components/multi-conditions').then((m) => ({ default: m.MultiConditionsFieldset }));
  ComponentLoader = () =>
    import('./components/multi-conditions').then((m) => ({ default: m.MultiConditionsCanvasComponent }));

  createDefaultConfig() {
    return {
      conditions: [createEmptyMultiCondition()],
      continueOnNoMatch: false,
    };
  }
}
