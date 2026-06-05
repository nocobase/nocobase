/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { evaluators } from '@nocobase/evaluators/client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Instruction, NodeDefaultView, useNodeContext } from '.';
import { Branch, useBranchIndex } from '../Branch';
import { RadioWithTooltip, RadioWithTooltipOption } from '../components/RadioWithTooltip';
import { renderEngineReference } from '../components/renderEngineReference';
import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import useStyles from '../style';
import { useWorkflowVariableOptions, WorkflowVariableTextArea } from '../variable';
import { CalculationConfig } from '../components/Calculation';
import { ClusterOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  css,
  cx,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCancelAction,
  useResourceActionContext,
  useToken,
} from '@nocobase/client';
import { Button, Tooltip, App, Space } from 'antd';
import { useGetAriaLabelOfAddButton, useWorkflowExecuted } from '../hooks';
import { createForm } from '@formily/core';
import { useForm } from '@formily/react';
import { uid } from '@nocobase/utils/client';

const BRANCH_INDEX = {
  DEFAULT: 1,
  OTHERWISE: 0,
};

function useUpdateConditionAction() {
  const node = useNodeContext();
  const form = useForm();
  const branchIndex = useBranchIndex();
  const apiClient = useAPIClient();
  const { refresh } = useResourceActionContext();
  const { setVisible } = useActionContext();

  return {
    async run() {
      console.log(node, branchIndex, form.values);
      await form.submit();
      try {
        await apiClient.resource('flow_nodes').update({
          filterByTk: node.id,
          values: {
            config: {
              ...node.config,
              conditions: node.config.conditions.map((item, index) =>
                index === branchIndex - 1 ? { ...item, ...form.values } : item,
              ),
            },
          },
        });
        setVisible(false);
        refresh();
      } catch (ex) {
        console.error(ex);
      }
    },
  };
}

type ConditionConfig = {
  uid: string;
  title?: string;
  engine?: string;
  calculation?: any;
  expression?: string;
};

function useConditionLabel() {
  const node = useNodeContext();
  const branchIndex = useBranchIndex();
  const condition = node.config.conditions[branchIndex - 1];
  return {
    title: condition?.title || lang('Condition {{index}}', { index: branchIndex }),
  };
}

function ConditionHeader(props) {
  return (
    <div
      className={css`
        position: relative;
        padding-top: 1em;
      `}
    >
      {props.children}
    </div>
  );
}

function getTooltipByResult(result: any) {
  return typeof result === 'string' ? result : null;
}

function ConditionHeaderCard(props) {
  const { token } = useToken();
  const node = useNodeContext();
  const index = useBranchIndex() - 1;
  const jobs = node.jobs ?? [];
  const job = jobs[jobs.length - 1];
  const style = {};
  let color;
  if (job) {
    const { conditions = [] } = job.meta ?? {};
    if (conditions[index] != null) {
      const result = conditions[index];
      switch (true) {
        case result === false:
          color = token.colorError;
          break;
        case result === true:
          color = token.colorSuccess;
          break;
        case typeof result === 'string':
          color = token.colorError;
          break;
        case typeof result === 'number':
          color = token.colorSuccess;
          break;
      }
      if (color) {
        Object.assign(style, {
          outline: `1px solid ${color}`,
        });
      }
    }
  }
  const content = (
    <Space
      className={css`
        padding: 0.5em 1em;
        border-radius: 2em;
        background-color: ${token.colorBgContainer};
        font-size: 0.8rem;

        .ant-nb-action {
          font-size: 0.8rem;
          color: ${color};
        }
      `}
    >
      {props.children}
    </Space>
  );

  const tooltip = job ? getTooltipByResult(job.meta?.conditions[index]) : null;

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}

function ConditionConfiguration({ condition, index }: { condition: ConditionConfig; index: number }) {
  const node = useNodeContext();
  const apiClient = useAPIClient();
  const { refresh } = useResourceActionContext();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const executed = useWorkflowExecuted();

  const form = useMemo(
    () =>
      createForm({
        initialValues: condition,
        pattern: executed ? 'readPretty' : 'editable',
      }),
    [condition],
  );

  // useEffect(() => {
  //   form.disabled = Boolean(executed);
  // }, [form, executed]);

  const onRemoveConfirm = useCallback(async () => {
    const nextConditions = [...node.config.conditions];
    nextConditions.splice(index - 1, 1);

    try {
      if (node.config.conditions.length) {
        await apiClient.resource('flow_nodes').destroyBranch({
          filterByTk: node.id,
          branchIndex: index,
          shift: 1,
        });
      }
      await apiClient.resource('flow_nodes').update({
        filterByTk: node.id,
        values: {
          config: {
            ...node.config,
            conditions: nextConditions,
          },
        },
      });

      refresh();
    } catch (ex) {
      console.error(ex);
    }
  }, [apiClient, index, node.config, node.id, refresh]);

  const onRemove = useCallback(() => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      onOk: onRemoveConfirm,
    });
  }, [modal, onRemoveConfirm, t]);

  return (
    <ConditionHeader>
      {executed <= 0 && node.config.conditions.length > 1 ? (
        <Tooltip title={lang('Delete branch')}>
          <Button
            type="text"
            shape="circle"
            icon={<DeleteOutlined />}
            onClick={onRemove}
            className={cx(
              'workflow-node-remove-button',
              'workflow-branch-remove-button',
              css`
                display: none;
                position: absolute;
                right: -2em;
                top: 1.35em;
              `,
            )}
            size="small"
          />
        </Tooltip>
      ) : null}
      <ConditionHeaderCard>
        <SchemaComponent
          components={{
            RadioWithTooltip,
            CalculationConfig,
            WorkflowVariableTextArea,
          }}
          scope={{
            renderEngineReference,
            useCancelAction,
            useUpdateConditionAction,
            useConditionLabel,
          }}
          schema={{
            type: 'void',
            name: `node_${node.id}_condition_${condition.uid}`,
            'x-component': 'Action.Link',
            'x-use-component-props': 'useConditionLabel',
            'x-component-props': {
              openMode: 'modal',
            },
            properties: {
              modal: {
                type: 'void',
                title: `{{t('Configure condition', { ns: "${NAMESPACE}" })}}`,
                'x-decorator': 'FormV2',
                'x-decorator-props': {
                  form,
                },
                'x-component': 'Action.Container',
                properties: {
                  fieldset: {
                    type: 'void',
                    'x-component': 'fieldset',
                    properties: {
                      title: {
                        type: 'string',
                        title: `{{t("Condition label", { ns: "${NAMESPACE}" })}}`,
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                      },
                      engine: {
                        type: 'string',
                        title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
                        'x-decorator': 'FormItem',
                        'x-component': 'RadioWithTooltip',
                        'x-component-props': {
                          options: [
                            ['basic', { label: `{{t("Basic", { ns: "${NAMESPACE}" })}}` }],
                            ...Array.from(evaluators.getEntities()).filter(([key]) =>
                              ['math.js', 'formula.js'].includes(key),
                            ),
                          ].reduce(
                            (result: RadioWithTooltipOption[], [value, options]: any) =>
                              result.concat({ value, ...options }),
                            [],
                          ),
                        },
                        required: true,
                        default: 'basic',
                      },
                      calculation: {
                        type: 'object',
                        title: `{{t("Condition", { ns: "${NAMESPACE}" })}}`,
                        'x-decorator': 'FormItem',
                        'x-component': 'CalculationConfig',
                        'x-reactions': {
                          dependencies: ['engine'],
                          fulfill: {
                            state: {
                              visible: '{{$deps[0] === "basic"}}',
                            },
                          },
                        },
                        required: true,
                      },
                      expression: {
                        type: 'string',
                        title: `{{t("Condition expression", { ns: "${NAMESPACE}" })}}`,
                        'x-decorator': 'FormItem',
                        'x-component': 'WorkflowVariableTextArea',
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
                            return lang('Expression syntax error');
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
                        required: true,
                      },
                    },
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Container.Footer',
                    properties: {
                      cancel: {
                        title: '{{ t("Cancel") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ useCancelAction }}',
                        },
                      },
                      submit: {
                        title: '{{ t("Submit") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: '{{ useUpdateConditionAction }}',
                        },
                      },
                    },
                  },
                },
              },
            },
          }}
        />
      </ConditionHeaderCard>
    </ConditionHeader>
  );
}

function ConditionBranch({ condition, index }) {
  const node = useNodeContext();
  const { nodes } = useFlowContext();
  const entry = nodes.find((item) => item.upstreamId === node.id && item.branchIndex === index);

  return (
    <Branch
      from={node}
      entry={entry}
      branchIndex={index}
      controller={<ConditionConfiguration condition={condition} index={index} />}
      className={css`
        &:hover > .workflow-branch-controller .workflow-branch-remove-button {
          display: block;
        }
      `}
    />
  );
}

function NodeComponent({ data }) {
  const {
    id,
    config: { conditions = [] },
  } = data;
  const { t } = useTranslation();
  const { nodes } = useFlowContext();
  const { styles } = useStyles();
  const executed = useWorkflowExecuted();
  const { getAriaLabel } = useGetAriaLabelOfAddButton(data);
  const apiClient = useAPIClient();
  const { refresh } = useResourceActionContext();
  const onAddBranch = useCallback(async () => {
    await apiClient.resource('flow_nodes').update({
      filterByTk: id,
      values: {
        config: {
          ...data.config,
          conditions: conditions.concat({ uid: uid() }),
        },
      },
    });
    refresh();
  }, [apiClient, conditions, data.config, id, refresh]);
  const defaultEntry = nodes.find((item) => item.upstreamId === id && item.branchIndex === 0);
  return (
    <NodeDefaultView data={data}>
      <div className={styles.nodeSubtreeClass}>
        <div className={styles.branchBlockClass}>
          {conditions.map((item, index) => {
            const branchIndex = index + 1;
            return <ConditionBranch key={item.uid} condition={item} index={branchIndex} />;
          })}
          <Branch
            from={data}
            entry={defaultEntry}
            branchIndex={0}
            controller={
              <ConditionHeader>
                <ConditionHeaderCard>{lang('Otherwise')}</ConditionHeaderCard>
              </ConditionHeader>
            }
            end={!data.config.continueOnNoMatch}
          />
        </div>
        <Tooltip
          title={lang('Add branch')}
          className={css`
            visibility: ${executed > 0 ? 'hidden' : 'visible'};
          `}
        >
          <Button
            aria-label={getAriaLabel('add-branch')}
            icon={<PlusOutlined />}
            className={css`
              position: relative;
              top: 1em;
              line-height: 1;
              transform-origin: center;
              transform: rotate(45deg);

              .anticon {
                transform-origin: center;
                transform: rotate(-45deg);
              }
            `}
            size="small"
            onClick={onAddBranch}
            disabled={executed > 0}
          />
        </Tooltip>
      </div>
    </NodeDefaultView>
  );
}

export default class extends Instruction {
  title = `{{t("Multi conditions", { ns: "${NAMESPACE}" })}}`;
  type = 'multi-conditions';
  group = 'control';
  description = `{{t('From left to right, attempt each branch sequentially based on the configured conditions. Only branches that meet the conditions will be executed. Otherwise, the next branch will be attempted. If none of the branches meet the conditions, it can either exit the process or continue to the next node based on configuration.', { ns: "${NAMESPACE}" })}}`;
  icon = (<ClusterOutlined />);
  fieldset = {
    continueOnNoMatch: {
      type: 'boolean',
      title: `{{t("When no condition matches", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          { label: `{{t('End as failed', { ns: "${NAMESPACE}" })}}`, value: false },
          { label: `{{t('Continue the workflow', { ns: "${NAMESPACE}" })}}`, value: true },
        ],
      },
      default: false,
    },
  };

  branching = [
    {
      label: `{{t('First condition', { ns: "${NAMESPACE}" })}}`,
      value: BRANCH_INDEX.DEFAULT,
    },
    {
      label: `{{t('Otherwise', { ns: "${NAMESPACE}" })}}`,
      value: BRANCH_INDEX.OTHERWISE,
    },
  ];

  scope = {
    renderEngineReference,
    useWorkflowVariableOptions,
  };
  components = {
    WorkflowVariableTextArea,
    RadioWithTooltip,
  };

  Component = NodeComponent;

  createDefaultConfig() {
    return {
      conditions: [
        {
          uid: uid(),
        },
      ],
      continueOnNoMatch: false,
    };
  }
}
