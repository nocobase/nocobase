/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { FormLayout } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { css, cx, useCompile, Variable } from '@nocobase/client';
import { evaluators } from '@nocobase/evaluators/client';
import {
  NodeDefaultView,
  Branch,
  useFlowContext,
  useStyles,
  VariableOption,
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  defaultFieldNames,
  nodesOptions,
  scopeOptions,
  triggerOptions,
  Instruction,
  RadioWithTooltip,
  renderEngineReference,
  RadioWithTooltipOption,
  CalculationConfig,
  useWorkflowVariableOptions,
  UseVariableOptions,
  useNodeContext,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, useLang } from '../locale';

function findOption(options: VariableOption[], paths: string[]) {
  let opts = options;
  let option = null;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const current = opts.find((item) => item.value === path);
    if (!current) {
      return null;
    }
    option = current;
    if (!current.isLeaf && current.loadChildren) {
      current.loadChildren(current);
    }
    if (current.children) {
      opts = current.children;
    }
  }
  return option;
}

function CardWrapper({ children }) {
  return (
    <Card>
      <FormLayout layout="vertical">{children}</FormLayout>
    </Card>
  );
}

function useScopeVariables(node, options) {
  const compile = useCompile();
  const langLoopTarget = useLang('Loop target');
  const langLoopIndex = useLang('Loop index');
  const langLoopLength = useLang('Loop length');
  const { target } = node.config;
  if (target == null) {
    return null;
  }

  const { fieldNames = defaultFieldNames, scope } = options;

  // const { workflow } = useFlowContext();
  // const current = useNodeContext();
  // const upstreams = useAvailableUpstreams(current);
  // find target data model by path described in `config.target`
  // 1. get options from $context/$jobsMapByNodeKey
  // 2. route to sub-options and use as loop target options
  let targetOption: VariableOption = {
    key: 'item',
    [fieldNames.value]: 'item',
    [fieldNames.label]: langLoopTarget,
  };

  if (typeof target === 'string' && target.startsWith('{{') && target.endsWith('}}')) {
    const paths = target
      .slice(2, -2)
      .split('.')
      .map((path) => path.trim());

    const targetOptions =
      scope ??
      [scopeOptions, nodesOptions, triggerOptions].map((item: any) => {
        const opts = item.useOptions({ ...options, current: node }).filter(Boolean);
        return {
          [fieldNames.label]: compile(item.label),
          [fieldNames.value]: item.value,
          key: item.value,
          [fieldNames.children]: opts,
          disabled: opts && !opts.length,
        };
      });

    const found = findOption(targetOptions, paths);

    targetOption = Object.assign({}, found, targetOption);
  }

  return [
    targetOption,
    { key: 'index', [fieldNames.value]: 'index', [fieldNames.label]: langLoopIndex },
    { key: 'length', [fieldNames.value]: 'length', [fieldNames.label]: langLoopLength },
  ];
}

function useVariableHook(options: UseVariableOptions = {}) {
  const { values } = useForm<any>();
  const node = useNodeContext();
  const current = {
    ...node,
    config: {
      ...node.config,
      target: values.target,
    },
  };
  const result = useWorkflowVariableOptions(options);
  const subOptions = useScopeVariables(current, {
    ...options,
    scope: result.filter((item) => ['$scopes', '$jobsMapByNodeKey', '$context'].includes(item.key)),
  });
  const { fieldNames = defaultFieldNames } = options;
  if (!subOptions) {
    return result;
  }

  const scope = result.find((item) => item[fieldNames.value] === '$scopes');
  if (scope) {
    if (!scope[fieldNames.children]) {
      scope[fieldNames.children] = [];
    }

    scope[fieldNames.children].unshift({
      key: node.key,
      [fieldNames.value]: node.key,
      [fieldNames.label]: node.title ?? `#${node.id}`,
      [fieldNames.children]: subOptions,
    });
    scope.disabled = false;
  }

  return [...result];
}

function LoopVariableTextArea({ variableOptions, ...props }): JSX.Element {
  const scope = useVariableHook(variableOptions);
  return <Variable.TextArea scope={scope} {...props} />;
}

export default class extends Instruction {
  title = `{{t("Loop", { ns: "${NAMESPACE}" })}}`;
  type = 'loop';
  group = 'control';
  description = `{{t("By using a loop node, you can perform the same operation on multiple sets of data. The source of these sets can be either multiple records from a query node or multiple associated records of a single record. Loop node can also be used for iterating a certain number of times or for looping through each character in a string. However, excessive looping may cause performance issues, so use with caution.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    target: {
      type: 'string',
      title: `{{t("Loop target", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("A single number will be treated as a loop count, a single string will be treated as an array of characters, and other non-array values will be converted to arrays. The loop node ends when the loop count is reached, or when the array loop is completed. You can also add condition nodes to the loop to terminate it.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        changeOnSelect: true,
        nullable: false,
        useTypedConstant: ['string', 'number'],
        className: css`
          width: 100%;

          .variable {
            flex: 1;
          }

          .ant-input.null-value {
            width: 100%;
          }
        `,
      },
      required: true,
      default: 1,
      'x-reactions': [
        {
          target: 'calculation',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: null,
            },
          },
        },
        {
          target: 'expression',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: '',
            },
          },
        },
      ],
    },
    startIndex: {
      type: 'number',
      title: `{{t("Start index", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("The index number used in loop scope variable.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          {
            label: `{{t("From 0", { ns: "${NAMESPACE}" })}}`,
            value: 0,
            tooltip: `{{t("Follow programming language conventions.", { ns: "${NAMESPACE}" })}}`,
          },
          {
            label: `{{t("From 1", { ns: "${NAMESPACE}" })}}`,
            value: 1,
            tooltip: `{{t("Follow natural language conventions.", { ns: "${NAMESPACE}" })}}`,
          },
        ],
      },
      default: 0,
    },
    condition: {
      type: 'void',
      title: `{{t("Loop condition on each item", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CardWrapper',
      'x-reactions': [
        {
          dependencies: ['target'],
          fulfill: {
            state: {
              visible: '{{Boolean($deps[0])}}',
            },
          },
        },
      ],
      properties: {
        checkpoint: {
          type: 'number',
          title: `{{t("When to check", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'RadioWithTooltip',
          'x-component-props': {
            options: [
              {
                label: `{{t("Before each starts", { ns: "${NAMESPACE}" })}}`,
                value: 0,
              },
              {
                label: `{{t("After each ends", { ns: "${NAMESPACE}" })}}`,
                value: 1,
              },
            ],
          },
          default: 0,
        },
        continueOnFalse: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'RadioWithTooltip',
          title: `{{t("When condition is not met on item", { ns: "${NAMESPACE}" })}}`,
          'x-component-props': {
            options: [
              {
                label: `{{t("Exit loop", { ns: "${NAMESPACE}" })}}`,
                value: false,
              },
              {
                label: `{{t("Continue on next item", { ns: "${NAMESPACE}" })}}`,
                value: true,
              },
            ],
          },
          default: false,
        },
        engine: {
          type: 'string',
          title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'RadioWithTooltip',
          'x-component-props': {
            options: [
              ['basic', { label: `{{t("Basic", { ns: "${NAMESPACE}" })}}` }],
              ...Array.from(evaluators.getEntities()).filter(([key]) => ['math.js', 'formula.js'].includes(key)),
            ].reduce(
              (result: RadioWithTooltipOption[], [value, options]: any) => result.concat({ value, ...options }),
              [],
            ),
          },
          default: 'basic',
        },
        calculation: {
          type: 'object',
          title: `{{t("Condition", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'CalculationConfig',
          'x-component-props': {
            useVariableHook,
          },
          'x-reactions': {
            dependencies: ['engine'],
            fulfill: {
              state: {
                visible: '{{$deps[0] === "basic"}}',
              },
            },
          },
        },
        expression: {
          type: 'string',
          title: `{{t("Condition expression", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'LoopVariableTextArea',
          'x-component-props': {
            changeOnSelect: true,
          },
          ['x-validator'](value, rules, { form }) {
            const { values } = form;
            const { evaluate } = evaluators.get(values.engine);
            const exp = value.trim().replace(/{{([^{}]+)}}/g, ' "1" ');
            try {
              evaluate(exp);
              return '';
            } catch (e) {
              return `Expression syntax error: ${e.message}`;
            }
          },
          'x-reactions': {
            dependencies: ['engine'],
            fulfill: {
              state: {
                visible: '{{$deps[0] !== "basic"}}',
              },
              schema: {
                description: '{{renderEngineReference($deps[0])}}',
              },
            },
          },
        },
      },
    },
    exit: {
      type: 'number',
      title: `{{t("When node inside loop failed", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        direction: 'vertical',
        options: [
          {
            label: `{{t("Exit workflow", { ns: "${NAMESPACE}" })}}`,
            value: 0,
          },
          {
            label: `{{t("Exit loop and continue workflow", { ns: "${NAMESPACE}" })}}`,
            value: 1,
          },
          {
            label: `{{t("Continue loop on next item", { ns: "${NAMESPACE}" })}}`,
            value: 2,
          },
        ],
      },
      default: 0,
    },
  };
  scope = {
    renderEngineReference,
  };
  components = {
    CardWrapper,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    LoopVariableTextArea,
    RadioWithTooltip,
    CalculationConfig,
  };
  Component({ data }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { nodes } = useFlowContext();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { styles } = useStyles();
    const entry = nodes.find((node) => node.upstreamId === data.id && node.branchIndex != null);

    return (
      <NodeDefaultView data={data}>
        <div className={styles.nodeSubtreeClass}>
          <div
            className={cx(
              styles.branchBlockClass,
              css`
                padding-left: 20em;
              `,
            )}
          >
            <Branch from={data} entry={entry} branchIndex={entry?.branchIndex ?? 0} />

            <div className={styles.branchClass}>
              <div className="workflow-branch-lines" />
              <div className={cx(styles.addButtonClass, styles.loopLineClass)}>
                <ArrowUpOutlined />
              </div>
            </div>
          </div>
        </div>
      </NodeDefaultView>
    );
  }
  useScopeVariables = useScopeVariables;
}
