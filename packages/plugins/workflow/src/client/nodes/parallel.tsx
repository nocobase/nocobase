import React, { useState } from "react";
import { css, cx } from "@emotion/css";
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from "antd";

import { NodeDefaultView } from ".";
import { Branch } from "../Branch";
import { useFlowContext } from '../FlowContext';
import { branchBlockClass, nodeSubtreeClass } from "../style";
import { lang, NAMESPACE } from "../locale";
import { RadioWithTooltip } from "../components/RadioWithTooltip";



export default {
  title: `{{t("Parallel branch", { ns: "${NAMESPACE}" })}}`,
  type: 'parallel',
  group: 'control',
  fieldset: {
    'config.mode': {
      type: 'string',
      name: 'config.mode',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: [
          {
            value: 'all',
            label: `{{t('All succeeded', { ns: "${NAMESPACE}" })}}`,
            tooltip: `{{t('Continue after all branches succeeded', { ns: "${NAMESPACE}" })}}`,
          },
          {
            value: 'any',
            label: `{{t('Any succeeded', { ns: "${NAMESPACE}" })}}`,
            tooltip: `{{t('Continue after any branch succeeded', { ns: "${NAMESPACE}" })}}`,
          },
          {
            value: 'race',
            label: `{{t('Any succeeded or failed', { ns: "${NAMESPACE}" })}}`,
            tooltip: `{{t('Continue after any branch succeeded, or exit after any branch failed', { ns: "${NAMESPACE}" })}}`,
          },
        ]
      },
      default: 'all'
    }
  },
  view: {

  },
  render(data) {
    const { id, config: { mode } } = data;
    const { nodes } = useFlowContext();
    const branches = nodes.reduce((result, node) => {
      if (node.upstreamId === id && node.branchIndex != null) {
        return result.concat(node);
      }
      return result;
    }, []).sort((a, b) => a.branchIndex - b.branchIndex);
    const [branchCount, setBranchCount] = useState(Math.max(2, branches.length));

    const tempBranches = Array(Math.max(0, branchCount - branches.length)).fill(null);
    const lastBranchHead = branches[branches.length - 1];

    return (
      <NodeDefaultView data={data}>
        <div className={cx(nodeSubtreeClass)}>
          <div className={cx(branchBlockClass)}>
            {branches.map((branch) => (
              <Branch key={branch.id} from={data} entry={branch} branchIndex={branch.branchIndex} />
            ))}
            {tempBranches.map((_, i) => (
              <Branch
                key={`temp_${branches.length + i}`}
                from={data}
                branchIndex={(lastBranchHead ? lastBranchHead.branchIndex : 0) + i + 1}
                controller={
                  branches.length + i > 1
                    ? (
                      <div className={css`
                        padding-top: 2em;

                        > button{
                          .anticon{
                            transform: rotate(45deg)
                          }
                        }
                      `}>
                        <Button
                          shape="circle"
                          icon={<PlusOutlined />}
                          onClick={() => setBranchCount(branchCount - 1)}
                        />
                      </div>
                    )
                    : null
                }
              />
            ))}
          </div>
          <div
            className={css`
              position: relative;
              height: 2em;
            `}
          >
            <Tooltip title={lang('Add branch')}>
              <Button
                icon={<PlusOutlined />}
                className={css`
                  position: absolute;
                  top: calc(50% - 1px);
                  transform: translateX(-50%) rotate(45deg);

                  .anticon{
                    transform: rotate(-45deg);
                  }
                `}
                onClick={() => setBranchCount(branchCount + 1)}
              />
            </Tooltip>
          </div>
        </div>
      </NodeDefaultView>
    )
  },
  components: {
    RadioWithTooltip
  }
};
