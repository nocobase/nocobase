/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SubModelItem } from '@nocobase/flow-engine';
import { CalendarOutlined } from '@ant-design/icons';
import React from 'react';
import {
  BaseTypeSets,
  Instruction,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from '../locale';

export default class DateCalculationInstruction extends Instruction {
  type = 'dateCalculation';
  title = tExpr('Date calculation');
  group = 'calculation';
  description = tExpr('Used for doing a series of date related calculation on an input value.');
  icon = (<CalendarOutlined />);
  testable = true;

  createDefaultConfig() {
    return {
      input: '{{$system.now}}',
      inputType: 'date',
      steps: [],
    };
  }

  FieldsetLoader = () =>
    import('./components/dateCalculation').then((module) => ({ default: module.DateCalculationFieldset }));

  useVariables(node: { key: string; title: string }, options?: UseVariableOptions): VariableOption | null {
    const types = options?.types;

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
      value: node.key,
      label: node.title,
    };
  }

  getCreateModelMenuItem({ node }): SubModelItem {
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
              defaultValue: tExpr('Date calculation result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: tExpr('Date calculation'),
            },
          },
        },
      },
    };
  }
}
