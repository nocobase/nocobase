/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2-native core-node instruction definitions (doc §9.1 runtime separation).
 *
 * These are lightweight registrations: they extend the shared `Instruction`
 * base class but carry only the static metadata the modern canvas needs to
 * render a card and list the node in the add-node menu — `type`, `title`,
 * `group`, `icon`, `branching`, `end`. The Formily-heavy v1 node classes are
 * NOT imported here (that would pull Formily into client-v2); each node's
 * config UI (`FieldsetLoader`) is added per node as it migrates.
 *
 * Only plugin-workflow's own core nodes live here. Downstream pro-plugin nodes
 * (manual, loop, javascript, …) register their own v2 instructions from their
 * own `client-v2` entries; until they do, those types are simply absent from
 * the v2 registry (omitted from the menu, placeholder card if already present).
 */

import React from 'react';
import {
  CalculatorOutlined,
  ClusterOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Instruction } from '../Instruction';
import { NAMESPACE } from '../../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

class CalculationInstruction extends Instruction {
  type = 'calculation';
  title = t('Calculation');
  group = 'calculation';
  icon = (<CalculatorOutlined />);
  testable = true;
}

class ConditionInstruction extends Instruction {
  type = 'condition';
  title = t('Condition');
  group = 'control';
  icon = (<QuestionCircleOutlined />);
  testable = true;
  // Branch into "Yes"/"No" when not in reject-on-false mode (mirrors v1).
  branching = ({ rejectOnFalse = true } = {}) =>
    rejectOnFalse
      ? false
      : [
          { label: t('Yes'), value: 1 },
          { label: t('No'), value: 0 },
        ];
}

class MultiConditionsInstruction extends Instruction {
  type = 'multi-conditions';
  title = t('Multi conditions');
  group = 'control';
  icon = (<ClusterOutlined />);
}

class EndInstruction extends Instruction {
  type = 'end';
  title = t('End process');
  group = 'control';
  icon = (<StopOutlined />);
  end = true;
}

class OutputInstruction extends Instruction {
  type = 'output';
  title = t('Output');
  group = 'control';
  icon = (<ProfileOutlined />);
}

class QueryInstruction extends Instruction {
  type = 'query';
  title = t('Query record');
  group = 'collection';
  icon = (<FileSearchOutlined />);
}

class CreateInstruction extends Instruction {
  type = 'create';
  title = t('Create record');
  group = 'collection';
  icon = (<FileAddOutlined />);
}

class UpdateInstruction extends Instruction {
  type = 'update';
  title = t('Update record');
  group = 'collection';
  icon = (<EditOutlined />);
}

class DestroyInstruction extends Instruction {
  type = 'destroy';
  title = t('Delete record');
  group = 'collection';
  icon = (<DeleteOutlined />);
}

/** Core node instruction classes, in v1 registration order. */
export const coreInstructions: Array<{ new (): Instruction }> = [
  CalculationInstruction,
  ConditionInstruction,
  MultiConditionsInstruction,
  EndInstruction,
  OutputInstruction,
  QueryInstruction,
  CreateInstruction,
  UpdateInstruction,
  DestroyInstruction,
];

export type InstructionGroup = { key: string; label: string };

/** Core instruction groups, in v1 display order. */
export const coreInstructionGroups: InstructionGroup[] = [
  { key: 'control', label: t('Control') },
  { key: 'calculation', label: t('Calculation') },
  { key: 'collection', label: t('Collection operations') },
  { key: 'manual', label: t('Manual') },
  { key: 'extended', label: t('Extended types') },
];
