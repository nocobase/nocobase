/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FunctionOutlined } from '@ant-design/icons';

import { SchemaInitializerItemType, Variable, useCollectionManager_deprecated } from '@nocobase/client';
import {
  BaseTypeSets,
  Instruction,
  ValueBlock,
  WorkflowVariableInput,
  defaultFieldNames,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE, useLang } from '../locale';

function useDynamicExpressionCollectionFieldMatcher(field): boolean {
  if (!['belongsTo', 'hasOne'].includes(field.type)) {
    return false;
  }

  if (this.getCollection(field.collectionName)?.template === 'expression') {
    return true;
  }

  const fields = this.getCollectionFields(field.target);
  return fields.some((f) => f.interface === 'expression');
}

function DynamicExpression({ value, onChange }) {
  const { getCollectionFields, getCollection } = useCollectionManager_deprecated();
  const scope = useWorkflowVariableOptions({
    types: [useDynamicExpressionCollectionFieldMatcher.bind({ getCollectionFields, getCollection })],
  });

  return <Variable.Input value={value} onChange={onChange} scope={scope} />;
}

export default class extends Instruction {
  title = `{{t("Dynamic expression calculation", { ns: "${NAMESPACE}" })}}`;
  type = 'dynamic-calculation';
  group = 'calculation';
  description = `{{t("Calculate an expression based on a calculation engine and obtain a value as the result. Variables in the upstream nodes can be used in the expression. The expression is dynamic one from an expression collections.", { ns: "${NAMESPACE}" })}}`;
  icon = (<FunctionOutlined />);
  fieldset = {
    expression: {
      type: 'string',
      title: `{{t("Calculation expression", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'DynamicExpression',
      required: true,
    },
    scope: {
      type: 'string',
      title: `{{t("Variable datasource", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        changeOnSelect: true,
        variableOptions: {
          types: [{ type: 'reference', options: { collection: '*', entity: true } }],
        },
      },
      'x-reactions': {
        dependencies: ['expression'],
        fulfill: {
          state: {
            visible: '{{$deps[0]}}',
          },
        },
      },
    },
  };
  components = {
    DynamicExpression,
    WorkflowVariableInput,
    ValueBlock,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
  useInitializers(node): SchemaInitializerItemType {
    return {
      name: `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      resultTitle: useLang('Calculation result'),
    };
  }
}
