import { ArrayItems } from '@formily/antd-v5';
import { CodeOutlined } from '@ant-design/icons';
import { SchemaInitializerItemType } from '@nocobase/client';
import {
  BaseTypeSets,
  Instruction,
  ValueBlock,
  WorkflowVariableInput,
  defaultFieldNames,
} from '@nocobase/plugin-workflow/client';
import { Space } from 'antd';
import React, { lazy } from 'react';

import { NAMESPACE, lang } from '../locale';
import { SubModelItem } from '@nocobase/flow-engine';

const CodeEditor = lazy(() => import('./CodeEditor'));

function useScriptDescription() {
  return (
    <div>
      <span>{lang('Node.js features supported can be found in the documentaion: ')}</span>
      <a href={lang('https://docs.nocobase.com/handbook/workflow-javascript')} target="_blank" rel="noreferrer">
        {lang('JavaScript node')}
      </a>
    </div>
  );
}

export default class extends Instruction {
  title = 'JavaScript';
  type = 'script';
  group = 'extended';
  description = `{{t("Execute a piece of JavaScript in an isolated Node.js environment.", { ns: "${NAMESPACE}" })}}`;
  icon = (<CodeOutlined />);
  fieldset = {
    arguments: {
      type: 'array',
      title: `{{t("Arguments", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("The arguments that will be used in script with same name.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      default: [],
      items: {
        type: 'object',
        'x-component': 'Space',
        properties: {
          name: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': {
              placeholder: `{{t("Name")}}`,
            },
            'x-validator': (value, rule, ctx) => {
              const varReg = /^[\p{L}$_][\p{L}\p{N}$_]*$/u;
              const items = ctx.form.getValuesIn().arguments.filter((v) => v.name === value);

              if (!varReg.test(value)) {
                return lang('Argument name is invalid');
              }
              if (items.length > 1) {
                return lang('Argument name duplicated');
              }
              return true;
            },
          },
          value: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableInput',
            'x-component-props': {
              changeOnSelect: true,
              useTypedConstant: true,
              placeholder: `{{t("Value")}}`,
            },
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add argument", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    content: {
      type: 'string',
      title: `{{t("Script content", { ns: "${NAMESPACE}" })}}`,
      description: '{{useScriptDescription()}}',
      'x-decorator': 'FormItem',
      'x-component': 'CodeEditor',
      default: 'return "Hello world!";',
    },
    timeout: {
      type: 'number',
      title: `{{t("Timeout", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("The maximum execution time of the script. 0 means no timeout.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 0,
        // step: 1,
        // precision: 1,
        className: 'auto-width',
        addonAfter: `{{t("Milliseconds", { ns: "${NAMESPACE}" })}}`,
      },
      default: 0,
    },
    continue: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': `{{t("Continue when exception thrown", { ns: "${NAMESPACE}" })}}`,
      default: false,
    },
  };
  scope = {
    useScriptDescription,
  };
  components = {
    ArrayItems,
    CodeEditor,
    WorkflowVariableInput,
    Space,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      value: key,
      label: title,
    };
  }
  useInitializers(node): SchemaInitializerItemType {
    return {
      name: node.title ?? `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Script result'),
    };
  }
  /**
   * 2.0
   */
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
              defaultValue: lang('Script result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("JavaScript", { ns: "${NAMESPACE}" })}}`,
            },
          },
        },
      },
    };
  }
  testable = true;
}
