import React from 'react';
import { ArrowUpOutlined } from '@ant-design/icons';

import { css, cx, useCompile } from '@nocobase/client';

import {
  NodeDefaultView,
  Branch,
  useFlowContext,
  useStyles,
  VariableOption,
  WorkflowVariableInput,
  defaultFieldNames,
  nodesOptions,
  scopeOptions,
  triggerOptions,
  Instruction,
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
        useTypedConstant: ['string', 'number', 'null'],
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
    },
  };
  components = {
    WorkflowVariableInput,
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
  useScopeVariables(node, options) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const compile = useCompile();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langLoopTarget = useLang('Loop target');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langLoopIndex = useLang('Loop index');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langLoopLength = useLang('Loop length');
    const { target } = node.config;
    if (!target) {
      return null;
    }

    const { fieldNames = defaultFieldNames } = options;

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

      const targetOptions = [scopeOptions, nodesOptions, triggerOptions].map((item: any) => {
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
}
