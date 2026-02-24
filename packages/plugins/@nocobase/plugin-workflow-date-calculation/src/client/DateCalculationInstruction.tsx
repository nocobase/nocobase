/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Trans } from 'react-i18next';
import { Button, Dropdown, Space, Flex, Tag } from 'antd';
import { ArrowDownOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';

import { SchemaComponent, css, useCompile, SchemaInitializerItemType } from '@nocobase/client';
import {
  Instruction,
  RadioWithTooltip,
  WorkflowVariableInput,
  defaultFieldNames,
  BaseTypeSets,
  ValueBlock,
} from '@nocobase/plugin-workflow/client';

import { functions, useFunctionOptions } from './dateFunctions';
import { DATA_TYPES_OPTION_MAP } from './constants';
import { NAMESPACE, useLang, lang } from '../locale';
import { SubModelItem } from '@nocobase/flow-engine';

const Calculation = {
  Step({ children }) {
    const compile = useCompile();
    const record = ArrayItems.useRecord();
    if (!record?.function) {
      return null;
    }
    const { outputType } = functions[record.function];
    const { color, label } = DATA_TYPES_OPTION_MAP[outputType];
    return (
      <>
        {children}
        <Flex align="center">
          <ArrowDownOutlined
            className={css`
              margin: 1em;
            `}
          />
          <Tag
            color={color}
            className={css`
              font-size: 10px;
              line-height: 14px;
            `}
          >
            {compile(label)}
          </Tag>
        </Flex>
      </>
    );
  },
  Title({ value }) {
    const compile = useCompile();
    const title = compile(functions[value].title);
    return (
      <span
        className={css`
          display: inline-block;
          background: #87d068;
          margin-left: 1rem;
          padding: 0.25em 0.5rem;
          border-radius: 0 0 0.25em 0.25em;
          color: #fff;
          font-size: 12px;
        `}
      >
        {title}
      </span>
    );
  },
  Arguments() {
    const index = ArrayItems.useIndex();
    const record = ArrayItems.useRecord();
    const { fieldset } = functions[record.function];
    return (
      <SchemaComponent
        schema={{
          type: 'void',
          name: `${index}_${record.function}`,
          'x-component': 'fieldset',
          'x-component-props': {
            className: css`
              display: flex;
              gap: 0.5rem;
              padding: 0.5rem 1rem;
            `,
          },
          properties: fieldset,
        }}
      />
    );
  },
  Addition() {
    const { values, disabled } = useForm();
    const array = ArrayItems.useArray();
    const inputType = values.steps?.length
      ? functions[values.steps[values.steps.length - 1].function]?.outputType
      : values.inputType;
    const items = useFunctionOptions(inputType);
    const langAddStep = useLang('Add step');
    const langResult = useLang('Result');
    return items.length ? (
      <Dropdown
        disabled={disabled}
        menu={{
          items,
          onClick({ key }) {
            const args = functions[key].defaultParams?.() ?? {};
            array.field?.push({ function: key, arguments: args });
          },
        }}
      >
        <Button icon={<PlusOutlined />}>{langAddStep}</Button>
      </Dropdown>
    ) : (
      <Button disabled>{langResult}</Button>
    );
  },
  Removable({ children }) {
    const { values } = useForm();
    const index = ArrayItems.useIndex();
    return index === values.steps.length - 1 ? children : null;
  },
};

export default class extends Instruction {
  title = `{{t("Date calculation", { ns: "${NAMESPACE}" })}}`;
  type = 'dateCalculation';
  group = 'calculation';
  description = `{{t("Used for doing a series of date related calculation on an input value.", { ns: "${NAMESPACE}" })}}`;
  icon = (<CalendarOutlined />);
  fieldset = {
    input: {
      type: 'string',
      title: `{{t("Input", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        changeOnSelect: true,
        useTypedConstant: ['date', 'number'],
        parseOptions: {
          stringToDate: true,
        },
      },
      required: true,
      default: '{{$system.now}}',
    },
    inputType: {
      type: 'string',
      title: `{{t("Input type as", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          {
            label: (
              <Tag color={DATA_TYPES_OPTION_MAP['date'].color}>
                <Trans ns={NAMESPACE}>{'Date type'}</Trans>
              </Tag>
            ),
            value: 'date',
            tooltip: `{{t("Input value will be converted from its original type to date type to do futher calculation by Day.js constructor.", { ns: "${NAMESPACE}" })}}`,
          },
          {
            label: (
              <Tag color={DATA_TYPES_OPTION_MAP['number'].color}>
                <Trans ns={NAMESPACE}>{'Number type'}</Trans>
              </Tag>
            ),
            value: 'number',
            tooltip: `{{t("Only calculation functions with numeric input value are supported.", { ns: "${NAMESPACE}" })}}`,
          },
        ],
      },
      default: 'date',
      'x-reactions': [
        {
          target: 'steps',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
      ],
    },
    steps: {
      type: 'array',
      title: `{{t("Calculation steps", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        'x-decorator': 'Calculation.Step',
        'x-component': 'ArrayItems.Item',
        'x-component-props': {
          className: css`
            flex-direction: column;
            width: 100%;
            overflow: hidden;
            background: #f5f5f5;
            border: none;
            border-radius: 0.5em;
            padding: 0;
            margin-bottom: 0;
          `,
        },
        properties: {
          meta: {
            type: 'void',
            'x-component': 'header',
            'x-component-props': {
              className: css`
                flex-grow: 1;
                position: relative;
                line-height: 1;
              `,
            },
            properties: {
              function: {
                type: 'string',
                'x-component': 'Calculation.Title',
              },
              remove: {
                type: 'void',
                'x-decorator': 'Calculation.Removable',
                'x-component': 'ArrayItems.Remove',
                'x-component-props': {
                  size: 'small',
                  style: {
                    position: 'absolute',
                    right: '0.25rem',
                    top: '0.25rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              },
            },
          },
          arguments: {
            type: 'object',
            'x-component': 'Calculation.Arguments',
          },
        },
      },

      properties: {
        add: {
          type: 'void',
          'x-component': 'Calculation.Addition',
        },
      },
    },
  };
  components = {
    WorkflowVariableInput,
    RadioWithTooltip,
    ArrayItems,
    Calculation,
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
      resultTitle: lang('Date calculation result'),
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
              defaultValue: lang('Date calculation result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("Date calculation", { ns: "${NAMESPACE}" })}}`,
            },
          },
        },
      },
    };
  }
  testable = true;
}
