/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SwapRightOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

import { tExpr } from './locale';

type VariableConfigItem = {
  key: string;
  alias?: string;
  path: string;
};

type NodeConfig = {
  parseArray?: boolean;
  variables?: VariableConfigItem[];
};

type NodeLike = {
  key: string;
  title: string;
  config?: NodeConfig;
};

type UseVariablesOptions = Record<string, unknown>;

export default class JSONVariableMappingInstruction extends Instruction {
  title = tExpr('JSON variable mapping');
  type = 'json-variable-mapping';
  group = 'control';
  description = tExpr('Used for mapping any JSON data to structured variables for usage in subsequent nodes.');
  icon = (<SwapRightOutlined />);
  FieldsetLoader = () =>
    import('./components/JSONVariableMappingFieldset').then((module) => ({
      default: module.JSONVariableMappingFieldset,
    }));

  createDefaultConfig(): NodeConfig {
    return {
      parseArray: false,
      variables: [],
    };
  }

  useVariables({ key, title, config }: NodeLike, _options?: UseVariablesOptions) {
    const variables = (config?.variables ?? []).map((item) => ({
      isLeaf: true,
      label: item.alias ? item.alias : item.path,
      value: item.key,
      key: item.key,
    }));

    return {
      value: key,
      label: title,
      children: variables,
    };
  }
}
