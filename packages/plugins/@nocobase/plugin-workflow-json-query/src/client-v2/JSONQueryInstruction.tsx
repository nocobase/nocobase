/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { NodeExpandOutlined } from '@ant-design/icons';
import {
  defaultFieldNames,
  Instruction,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';

import { tExpr } from './locale';

type JSONQueryModelItem = {
  path: string;
  alias?: string;
  label: string;
};

type JSONQueryConfig = {
  engine?: string;
  source?: string;
  expression?: string;
  model?: JSONQueryModelItem[];
};

type JSONQueryNode = {
  key: string;
  title: string;
  config?: JSONQueryConfig;
};

export default class JSONQueryInstruction extends Instruction {
  title = tExpr('JSON calculation');
  type = 'json-query';
  group = 'calculation';
  description = tExpr('Transforming or calculating values from complex JSON data.');
  icon = (<NodeExpandOutlined />);
  testable = true;
  FieldsetLoader = () =>
    import('./components/JSONQueryFieldset').then((module) => ({
      default: module.JSONQueryFieldset,
    }));

  createDefaultConfig(): JSONQueryConfig {
    return {
      engine: 'jmespath',
      model: [],
    };
  }

  useVariables({ key, title, config }: JSONQueryNode, { fieldNames = defaultFieldNames }: UseVariableOptions = {}) {
    return {
      [fieldNames.value ?? defaultFieldNames.value]: key,
      [fieldNames.label ?? defaultFieldNames.label]: title,
      [fieldNames.children ?? defaultFieldNames.children]: config?.model?.length
        ? config.model.map(
            (item): VariableOption => ({
              [fieldNames.value ?? defaultFieldNames.value]: item.alias || item.path,
              [fieldNames.label ?? defaultFieldNames.label]: item.label,
            }),
          )
        : null,
    };
  }
}
