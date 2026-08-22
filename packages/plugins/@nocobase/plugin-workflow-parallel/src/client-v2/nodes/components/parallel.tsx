/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { css } from '@emotion/css';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Tag, Tooltip, theme } from 'antd';
import type { CanvasNode } from '@nocobase/plugin-workflow/client-v2';
import {
  Branch,
  NodeDefaultView,
  RadioWithTooltip,
  useFlowContext,
  useStyles,
} from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../../locale';

type ParallelNode = CanvasNode & {
  config?: {
    mode?: 'all' | 'any' | 'race' | 'allSettled';
  };
};

type ParallelModeOption = {
  value: NonNullable<ParallelNode['config']>['mode'];
  label: string;
  tooltip: string;
};

function useParallelModeOptions(): ParallelModeOption[] {
  const t = useT();

  return [
    {
      value: 'all',
      label: t('All succeeded'),
      tooltip: t('Continue after all branches succeeded'),
    },
    {
      value: 'any',
      label: t('Any succeeded'),
      tooltip: t('Continue after any branch succeeded'),
    },
    {
      value: 'race',
      label: t('Any succeeded or failed'),
      tooltip: t('Continue after any branch succeeded, or exit after any branch failed.'),
    },
    {
      value: 'allSettled',
      label: t('Run all branches (ignore failures)'),
      tooltip: t('Always continue after all branches end, regardless of success or failure.'),
    },
  ];
}

export function ParallelFieldset() {
  const t = useT();
  const options = useParallelModeOptions();

  return (
    <Form.Item name={['config', 'mode']} label={t('Mode')} initialValue="all">
      <RadioWithTooltip direction="vertical" options={options} />
    </Form.Item>
  );
}

export function ParallelCanvasComponent({ data }: { data: ParallelNode }) {
  const t = useT();
  const { token } = theme.useToken();
  const { styles } = useStyles();
  const { nodes = [], workflow } = useFlowContext() ?? {};
  const executed = BigInt(workflow?.versionStats?.executed || 0) > 0n;
  const branches = nodes
    .filter((node): node is ParallelNode => node.upstreamId === data.id && node.branchIndex != null)
    .sort((a, b) => Number(a.branchIndex) - Number(b.branchIndex));
  const [branchCount, setBranchCount] = useState(Math.max(2, branches.length));

  const tempBranches = Array.from({ length: Math.max(0, branchCount - branches.length) });
  const lastBranchHead = branches[branches.length - 1];

  const numberedBranchTagClass = css`
    position: relative;
    margin: ${token.margin}px 0 0;
  `;
  const removeBranchControllerClass = css`
    padding-top: ${token.paddingLG}px;

    > button {
      line-height: 1;
    }

    .anticon {
      transform: rotate(45deg);
    }
  `;
  const addBranchButtonClass = css`
    position: relative;
    top: ${token.padding}px;
    line-height: 1;
    transform-origin: center;
    transform: rotate(45deg);
    visibility: ${executed ? 'hidden' : 'visible'};

    .anticon {
      transform-origin: center;
      transform: rotate(-45deg);
    }
  `;

  return (
    <NodeDefaultView data={data}>
      <div className={styles.nodeSubtreeClass}>
        <div className={styles.branchBlockClass}>
          {branches.map((branch, index) => (
            <Branch
              key={branch.id}
              from={data}
              entry={branch}
              branchIndex={branch.branchIndex}
              controller={<Tag className={numberedBranchTagClass}>{index + 1}</Tag>}
            />
          ))}
          {tempBranches.map((_, index) => (
            <Branch
              key={`temp_${branches.length + index}`}
              from={data}
              branchIndex={Number(lastBranchHead?.branchIndex ?? 0) + index + 1}
              controller={
                branches.length + index > 1 ? (
                  <div className={removeBranchControllerClass}>
                    <Button
                      aria-label={['remove-button', data?.type, data?.title, branches.length + index + 1]
                        .filter(Boolean)
                        .join('-')}
                      shape="circle"
                      icon={<PlusOutlined />}
                      onClick={() => setBranchCount(branchCount - 1)}
                      disabled={executed}
                      size="small"
                    />
                  </div>
                ) : null
              }
            />
          ))}
        </div>
        <Tooltip title={t('Add branch')}>
          <Button
            aria-label={['add-button', data?.type, data?.title, 'add-branch'].filter(Boolean).join('-')}
            icon={<PlusOutlined />}
            className={addBranchButtonClass}
            size="small"
            onClick={() => setBranchCount(branchCount + 1)}
            disabled={executed}
          />
        </Tooltip>
      </div>
    </NodeDefaultView>
  );
}
