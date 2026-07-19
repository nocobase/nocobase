/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeOutlined } from '@ant-design/icons';
import { Instruction, type LoaderOf } from '@nocobase/plugin-workflow/client-v2';
import React from 'react';
import type { SubModelItem } from '@nocobase/flow-engine';

import { tExpr } from '../locale';
import { SCRIPT_DEFAULT_CONFIG, supportsScriptVariableTypes } from './shared';

type ScriptVariableNode = {
  key?: string;
  title?: string;
};

type ScriptUseVariableOptions = {
  types?: unknown[];
};

type WorkflowNodeLike = {
  id: string | number;
  key: string;
  title?: string;
};

export default class ScriptInstruction extends Instruction {
  type = 'script';
  title = tExpr('JavaScript');
  group = 'extended';
  description = tExpr('Execute a piece of JavaScript in an isolated Node.js environment.');
  icon = (<CodeOutlined />);
  testable = true;
  FieldsetLoader: LoaderOf = () => import('./components/script');

  private translate = (key: string) => key;

  bindTranslate(translate: (key: string) => string) {
    this.translate = translate;
    return this;
  }

  createDefaultConfig() {
    return { ...SCRIPT_DEFAULT_CONFIG };
  }

  useVariables({ key, title }: ScriptVariableNode, { types }: ScriptUseVariableOptions = {}) {
    if (!supportsScriptVariableTypes(types)) {
      return null;
    }

    return {
      value: key,
      label: title,
    };
  }

  getCreateModelMenuItem({ node }: { node: WorkflowNodeLike }): SubModelItem {
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
              defaultValue: this.translate('Script result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: tExpr('JavaScript'),
            },
          },
        },
      },
    };
  }
}
