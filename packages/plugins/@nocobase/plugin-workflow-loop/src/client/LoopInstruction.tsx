/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { ArrowUpOutlined, RollbackOutlined } from '@ant-design/icons';
import { Card, Checkbox } from 'antd';
import { FormLayout, FormItem } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { css, cx, SchemaComponent, useCompile, Variable } from '@nocobase/client';
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
  CalculationConfig,
  useWorkflowVariableOptions,
  UseVariableOptions,
  useNodeContext,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, useLang } from '../locale';
import { useTranslation } from 'react-i18next';

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

function LoopCondition({ value, onChange }) {
  const { t } = useTranslation();
  const onCheckpointChange = useCallback(
    (ev) => {
      onChange({ ...value, checkpoint: ev.target.value });
    },
    [value, onChange],
  );
  const onContinueOnFalseChange = useCallback(
    (ev) => {
      onChange({ ...value, continueOnFalse: ev.target.value });
    },
    [value, onChange],
  );
  const onCalculationChange = useCallback(
    (calculation) => {
      onChange({ ...value, calculation });
    },
    [value, onChange],
  );
  return (
    <>
      <Checkbox
        checked={Boolean(value)}
        onChange={(ev) => {
          onChange(
            ev.target.checked
              ? { checkpoint: 0, continueOnFalse: false, calculation: { group: { type: 'and', calculations: [] } } }
              : false,
          );
        }}
      >
        {t('Enable loop condition', { ns: NAMESPACE })}
      </Checkbox>
      {value ? (
        <Card>
          <FormLayout layout="vertical">
            <FormItem label={t('Condition', { ns: NAMESPACE })}>
              <CalculationConfig
                value={value.calculation}
                onChange={onCalculationChange}
                useVariableHook={useVariableHook}
              />
            </FormItem>
            <FormItem label={t('When to check', { ns: NAMESPACE })}>
              <RadioWithTooltip
                value={value.checkpoint}
                onChange={onCheckpointChange}
                options={[
                  {
                    label: t('Before each starts', { ns: NAMESPACE }),
                    value: 0,
                  },
                  {
                    label: t('After each ends', { ns: NAMESPACE }),
                    value: 1,
                  },
                ]}
              />
            </FormItem>
            <FormItem label={t('When condition is not met on item', { ns: NAMESPACE })}>
              <RadioWithTooltip
                value={value.continueOnFalse}
                onChange={onContinueOnFalseChange}
                options={[
                  {
                    label: t('Exit loop', { ns: NAMESPACE }),
                    value: false,
                  },
                  {
                    label: t('Continue on next item', { ns: NAMESPACE }),
                    value: true,
                  },
                ]}
              />
            </FormItem>
          </FormLayout>
        </Card>
      ) : null}
    </>
  );
}

function useScopeVariables(node, options) {
  const compile = useCompile();
  const langLoopTarget = useLang('Loop target');
  const langLoopIndex = useLang('Loop index (starts from 0)');
  const langLoopSequence = useLang('Loop sequence (starts from 1)');
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
    { key: 'sequence', [fieldNames.value]: 'sequence', [fieldNames.label]: langLoopSequence },
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
  icon = (<RollbackOutlined style={{}} />);
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
        useTypedConstant: ['string', ['number', { step: 1, min: 0, precision: 0 }]],
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
    // startIndex: {
    //   type: 'number',
    //   title: `{{t("Start index", { ns: "${NAMESPACE}" })}}`,
    //   description: `{{t("The index number used in loop scope variable.", { ns: "${NAMESPACE}" })}}`,
    //   'x-decorator': 'FormItem',
    //   'x-component': 'RadioWithTooltip',
    //   'x-component-props': {
    //     options: [
    //       {
    //         label: `{{t("From 0", { ns: "${NAMESPACE}" })}}`,
    //         value: 0,
    //         tooltip: `{{t("Follow programming language conventions.", { ns: "${NAMESPACE}" })}}`,
    //       },
    //       {
    //         label: `{{t("From 1", { ns: "${NAMESPACE}" })}}`,
    //         value: 1,
    //         tooltip: `{{t("Follow natural language conventions.", { ns: "${NAMESPACE}" })}}`,
    //       },
    //     ],
    //   },
    //   default: 0,
    // },
    condition: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'LoopCondition',
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
      default: false,
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
  branching = true;
  scope = {
    renderEngineReference,
  };
  components = {
    LoopCondition,
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
                padding-left: 16em;
              `,
            )}
          >
            <Branch from={data} entry={entry} branchIndex={entry?.branchIndex ?? 0} />

            <div className={styles.branchClass}>
              <div className="workflow-branch-lines" />
              <div className={styles.loopLineClass}>
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
