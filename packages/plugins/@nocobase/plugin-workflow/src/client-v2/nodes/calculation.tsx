/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SubModelItem } from '@nocobase/flow-engine';
import { CalculatorOutlined } from '@ant-design/icons';
import React from 'react';
import { Instruction } from '../canvas/Instruction';
import { BaseTypeSets, type UseVariableOptions, type VariableOption } from '../canvas/collectionFieldOptions';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

type CalculationVariableNode = {
  key: string;
  title: string;
};

type CalculationResultNode = {
  id?: string | number;
  key: string;
  title?: string;
  config?: unknown;
};

export default class extends Instruction {
  type = 'calculation';
  title = t('Calculation');
  group = 'calculation';
  description = t(
    'Calculate an expression based on a calculation engine and obtain a value as the result. Variables in the upstream nodes can be used in the expression.',
  );
  icon = (<CalculatorOutlined />);
  testable = true;

  FieldsetLoader = () => import('./components/calculation').then((m) => ({ default: m.CalculationFieldset }));

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

  getCreateModelMenuItem({ node }: { node: CalculationResultNode }): SubModelItem {
    return {
      key: node.title ?? `#${node.id}`,
      label: node.title ?? `#${node.id}`,
      useModel: 'NodeValueModel',
      createModelOptions: {
        use: 'NodeValueModel',
        stepParams: {
          valueSettings: {
            init: {
              dataSource: `{{$jobsMapByNodeKey.${node.key}}}`,
              defaultValue: t('Calculation result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: t('Calculation'),
            },
          },
        },
      },
    };
  }
}
