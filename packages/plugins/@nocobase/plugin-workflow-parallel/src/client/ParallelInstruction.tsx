/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { ApartmentOutlined, PlusOutlined } from '@ant-design/icons';

import { css } from '@nocobase/client';

import {
  NodeDefaultView,
  Branch,
  useFlowContext,
  useStyles,
  useGetAriaLabelOfAddButton,
  RadioWithTooltip,
  Instruction,
  useWorkflowExecuted,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, useLang } from '../locale';

function NodeComponent({ data }) {
  const { styles } = useStyles();
  const {
    id,
    config: { mode },
  } = data;
  const { nodes } = useFlowContext();
  const executed = useWorkflowExecuted();
  const branches = nodes
    .reduce((result, node) => {
      if (node.upstreamId === id && node.branchIndex != null) {
        return result.concat(node);
      }
      return result;
    }, [])
    .sort((a, b) => a.branchIndex - b.branchIndex);
  const [branchCount, setBranchCount] = useState(Math.max(2, branches.length));
  const { getAriaLabel } = useGetAriaLabelOfAddButton(data);
  const langAddBranch = useLang('Add branch');

  const tempBranches = Array(Math.max(0, branchCount - branches.length)).fill(null);
  const lastBranchHead = branches[branches.length - 1];

  return (
    <NodeDefaultView data={data}>
      <div className={styles.nodeSubtreeClass}>
        <div className={styles.branchBlockClass}>
          {branches.map((branch, i) => (
            <Branch
              key={branch.id}
              from={data}
              entry={branch}
              branchIndex={branch.branchIndex}
              controller={
                <Tag
                  className={css`
                    position: relative;
                    margin: 1rem 0 0 0;
                  `}
                >
                  {i + 1}
                </Tag>
              }
            />
          ))}
          {tempBranches.map((_, i) => (
            <Branch
              key={`temp_${branches.length + i}`}
              from={data}
              branchIndex={(lastBranchHead ? lastBranchHead.branchIndex : 0) + i + 1}
              controller={
                branches.length + i > 1 ? (
                  <div
                    className={css`
                      padding-top: 2em;

                      > button {
                        line-height: 1;

                        .anticon {
                          transform: rotate(45deg);
                        }
                      }
                    `}
                  >
                    <Button
                      shape="circle"
                      icon={<PlusOutlined />}
                      onClick={() => setBranchCount(branchCount - 1)}
                      disabled={executed > 0}
                      size="small"
                    />
                  </div>
                ) : null
              }
            />
          ))}
        </div>
        <Tooltip
          title={langAddBranch}
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
            onClick={() => setBranchCount(branchCount + 1)}
            disabled={executed > 0}
          />
        </Tooltip>
      </div>
    </NodeDefaultView>
  );
}

export default class extends Instruction {
  title = `{{t("Parallel branch", { ns: "${NAMESPACE}" })}}`;
  type = 'parallel';
  group = 'control';
  description = `{{t("Run multiple branch processes in parallel.", { ns: "${NAMESPACE}" })}}`;
  icon = (<ApartmentOutlined style={{}} />);
  fieldset = {
    mode: {
      type: 'string',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        direction: 'vertical',
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
            tooltip: `{{t('Continue after any branch succeeded, or exit after any branch failed.', { ns: "${NAMESPACE}" })}}`,
          },
          {
            value: 'allSettled',
            label: `{{t('Run all branches (ignore failures)', { ns: "${NAMESPACE}" })}}`,
            tooltip: `{{t('Always continue after all branches end, regardless of success or failure.', { ns: "${NAMESPACE}" })}}`,
          },
        ],
      },
      default: 'all',
    },
  };
  branching = true;
  components = {
    RadioWithTooltip,
  };
  Component = NodeComponent;
}
