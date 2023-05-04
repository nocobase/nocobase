import React from 'react';
import { Alert } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { cx, css } from '@emotion/css';

import { useCompile } from '@nocobase/client';

import { NodeDefaultView } from '.';
import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import { useWorkflowVariableOptions, VariableOption, VariableTypes } from '../variable';
import { addButtonClass, branchBlockClass, branchClass, nodeSubtreeClass } from '../style';
import { Branch } from '../Branch';

function findOption(options: VariableOption[], paths: string[]) {
  let current = options;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const option = current.find((item) => item.value === path);
    if (!option) {
      return null;
    }
    if (option.children) {
      current = option.children;
    }
  }
  return current;
}

export default {
  title: `{{t("Loop", { ns: "${NAMESPACE}" })}}`,
  type: 'loop',
  group: 'control',
  fieldset: {
    warning: {
      type: 'void',
      'x-component': Alert,
      'x-component-props': {
        type: 'warning',
        showIcon: true,
        message: `{{t("Loop will cause performance issue based on the quantity, please use with caution.", { ns: "${NAMESPACE}" })}}`,
        className: css`
          width: 100%;
          font-size: 85%;
          margin-bottom: 2em;
        `,
      },
    },
    target: {
      type: 'string',
      title: `{{t("Loop target", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Single number will be treated as times, single string will be treated as chars, other non-array value will be turned into a single item array.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope: '{{useWorkflowVariableOptions}}',
        useTypedConstant: ['string', 'number', 'null'],
      },
      required: true,
    },
  },
  view: {},
  render: function Renderer(data) {
    const { nodes } = useFlowContext();
    const entry = nodes.find((node) => node.upstreamId === data.id && node.branchIndex != null);

    return (
      <NodeDefaultView data={data}>
        <div className={cx(nodeSubtreeClass)}>
          <div
            className={cx(
              branchBlockClass,
              css`
                padding-left: 20em;
              `,
            )}
          >
            <Branch from={data} entry={entry} branchIndex={entry?.branchIndex ?? 0} />

            <div className={cx(branchClass)}>
              <div className="workflow-branch-lines" />
              <div
                className={cx(
                  addButtonClass,
                  css`
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 2em;
                    height: 6em;
                  `,
                )}
              >
                <ArrowUpOutlined
                  className={css`
                    background-color: #f0f2f5;
                  `}
                />
              </div>
            </div>
          </div>
          <div
            className={css`
              position: relative;
              height: 2em;
            `}
          />
        </div>
      </NodeDefaultView>
    );
  },
  scope: {
    useWorkflowVariableOptions,
  },
  components: {},
  useScopeVariables(node, types) {
    const compile = useCompile();
    const { target } = node.config;
    if (!target) {
      return null;
    }

    // const { workflow } = useFlowContext();
    // const current = useNodeContext();
    // const upstreams = useAvailableUpstreams(current);
    // find target data model by path described in `config.target`
    // 1. get options from $context/$jobsMapByNodeId
    // 2. route to sub-options and use as loop target options
    const targetOption: VariableOption = { key: 'item', value: 'item', label: lang('Loop target') };

    if (typeof target === 'string' && target.startsWith('{{') && target.endsWith('}}')) {
      const paths = target
        .slice(2, -2)
        .split('.')
        .map((path) => path.trim());

      const options = VariableTypes.filter((item) => ['$context', '$jobsMapByNodeId'].includes(item.value)).map(
        (item: any) => {
          const opts = typeof item.useOptions === 'function' ? item.useOptions(node, types).filter(Boolean) : null;
          return {
            label: compile(item.title),
            value: item.value,
            key: item.value,
            children: compile(opts),
            disabled: opts && !opts.length,
          };
        },
      );

      targetOption.children = findOption(options, paths);
    }

    return [
      targetOption,
      { key: 'index', value: 'index', label: lang('Loop index') },
      { key: 'length', value: 'length', label: lang('Loop length') },
    ];
  },
};
