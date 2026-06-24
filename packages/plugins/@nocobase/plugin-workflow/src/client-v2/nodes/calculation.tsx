/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CalculatorOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { BaseTypeSets, type UseVariableOptions, type VariableOption } from '../canvas/collectionFieldOptions';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

type CalculationVariableNode = {
  key: string;
  title: string;
};

export default class extends Instruction {
  type = 'calculation';
  title = t('Calculation');
  group = 'calculation';
  icon = (<CalculatorOutlined />);
  testable = true;

  useVariables({ key, title }: CalculationVariableNode, { types }: UseVariableOptions = {}): VariableOption | null {
    if (
      types &&
      !types.some(
        (type) =>
          typeof type === 'string' &&
          (type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type))),
      )
    ) {
      return null;
    }
    return {
      value: key,
      label: title,
    };
  }
}
