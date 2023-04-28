import React from 'react';
import { cx, css } from '@emotion/css';
import parse from 'json-templates';
import { ArrowUpOutlined } from '@ant-design/icons';

import { NodeDefaultView } from '.';
import { useFlowContext } from '../FlowContext';
import { lang, NAMESPACE } from '../locale';
import { BaseTypeSets, useWorkflowVariableOptions } from '../variable';
import { addButtonClass, branchBlockClass, branchClass, nodeSubtreeClass } from '../style';
import { Branch } from '../Branch';

export default {
  title: `{{t("Loop", { ns: "${NAMESPACE}" })}}`,
  type: 'loop',
  group: 'control',
  fieldset: {
    target: {
      type: 'string',
      title: `{{t("Loop target", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope: '{{useWorkflowVariableOptions}}',
      },
      required: true,
    },
  },
  view: {},
  render: function Renderer(data) {
    const { workflow, nodes } = useFlowContext();
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
                    position: relative;
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
  components: {
    CalculationResult({ dataSource }) {
      const { execution } = useFlowContext();
      if (!execution) {
        return lang('Calculation result');
      }
      const result = parse(dataSource)({
        $jobsMapByNodeId: (execution.jobs ?? []).reduce(
          (map, job) => Object.assign(map, { [job.nodeId]: job.result }),
          {},
        ),
      });

      return (
        <pre
          className={css`
            margin: 0;
          `}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    },
  },
  getOptions(config, types) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return [
      // { key: '', value: '', label: lang('Calculation result') }
    ];
  },
};
