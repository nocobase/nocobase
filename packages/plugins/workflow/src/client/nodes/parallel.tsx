import React, { useState } from "react";
import { css, cx } from "@emotion/css";
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { i18n } from "@nocobase/client";

import { NodeDefaultView } from ".";
import { Branch, useFlowContext } from "../WorkflowCanvas";
import { branchBlockClass, nodeSubtreeClass } from "../style";



export default {
  title: '{{t("Parallel branch")}}',
  type: 'parallel',
  group: 'control',
  fieldset: {
    'config.mode': {
      type: 'string',
      name: 'config.mode',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
      },
      enum: [
        {
          value: 'all',
          label: (
            <Tooltip
              title={i18n.t('Continue after all branches succeeded')}
              placement="bottom"
            >
              {i18n.t('All succeeded')} <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        },
        {
          value: 'any',
          label: (
            <Tooltip
              title={i18n.t('Continue after any branch succeeded')}
              placement="bottom"
            >
              {i18n.t('Any succeeded')} <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        },
        {
          value: 'race',
          label: (
            <Tooltip
              title={i18n.t('Continue after any branch succeeded, or exit after any branch failed')}
              placement="bottom"
            >
              {i18n.t('Any succeeded or failed')} <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        },
      ],
      default: 'all'
    }
  },
  view: {

  },
  render(data) {
    const { id, config: { mode } } = data;
    const { t } = useTranslation();
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
            <Tooltip title={t('Add branch')}>
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
  }
};
