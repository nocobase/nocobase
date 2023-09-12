import { ArrowUpOutlined } from '@ant-design/icons';
import { css, cx, useCompile } from '@nocobase/client';
import React from 'react';
import { NodeDefaultView } from '.';
import { Branch } from '../Branch';
import { useFlowContext } from '../FlowContext';
import { NAMESPACE, lang } from '../locale';
import useStyles from '../style';
import {
  VariableOption,
  defaultFieldNames,
  nodesOptions,
  triggerOptions,
  useWorkflowVariableOptions,
} from '../variable';

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

export default {
  title: `{{t("Loop", { ns: "${NAMESPACE}" })}}`,
  type: 'loop',
  group: 'control',
  description: `{{t("By using a loop node, you can perform the same operation on multiple sets of data. The source of these sets can be either multiple records from a query node or multiple associated records of a single record. Loop node can also be used for iterating a certain number of times or for looping through each character in a string. However, excessive looping may cause performance issues, so use with caution.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    target: {
      type: 'string',
      title: `{{t("Loop target", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("A single number will be treated as a loop count, a single string will be treated as an array of characters, and other non-array values will be converted to arrays. The loop node ends when the loop count is reached, or when the array loop is completed. You can also add condition nodes to the loop to terminate it.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope: '{{useWorkflowVariableOptions()}}',
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
  },
  view: {},
  component: function Component({ data }) {
    const { nodes } = useFlowContext();
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
  useScopeVariables(node, options) {
    const compile = useCompile();
    const { target } = node.config;
    if (!target) {
      return null;
    }

    const { fieldNames = defaultFieldNames } = options;

    // const { workflow } = useFlowContext();
    // const current = useNodeContext();
    // const upstreams = useAvailableUpstreams(current);
    // find target data model by path described in `config.target`
    // 1. get options from $context/$jobsMapByNodeId
    // 2. route to sub-options and use as loop target options
    let targetOption: VariableOption = {
      key: 'item',
      [fieldNames.value]: 'item',
      [fieldNames.label]: lang('Loop target'),
    };

    if (typeof target === 'string' && target.startsWith('{{') && target.endsWith('}}')) {
      const paths = target
        .slice(2, -2)
        .split('.')
        .map((path) => path.trim());

      const targetOptions = [nodesOptions, triggerOptions].map((item: any) => {
        const opts = item.useOptions(options).filter(Boolean);
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
      { key: 'index', [fieldNames.value]: 'index', [fieldNames.label]: lang('Loop index') },
      { key: 'length', [fieldNames.value]: 'length', [fieldNames.label]: lang('Loop length') },
    ];
  },
};
