/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import { cx } from '@nocobase/client';

import { AddNodeSlot } from './AddNodeContext';
import { BranchContext } from './BranchContext';
import { useGetAriaLabelOfAddButton } from './hooks/useGetAriaLabelOfAddButton';
import { Node } from './nodes';
import useStyles from './style';

export { useBranchContext, useBranchIndex } from './BranchContext';

function EndSign({ title }: { title?: React.ReactNode }) {
  const content = (
    <div className="end-sign">
      <CloseOutlined />
    </div>
  );

  return title ? <Tooltip title={title}>{content}</Tooltip> : content;
}

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null,
  className,
  end,
  addable = true,
  syncOnly = false,
  start = false,
  startTitle,
  dashed = false,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  controller?: React.ReactNode;
  className?: string;
  end?: boolean;
  addable?: boolean;
  syncOnly?: boolean;
  start?: boolean;
  startTitle?: React.ReactNode;
  dashed?: boolean;
}) {
  const { styles } = useStyles();
  const { getAriaLabel } = useGetAriaLabelOfAddButton(from, branchIndex);
  const list: any[] = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <BranchContext.Provider value={{ branchIndex, addable, syncOnly }}>
      <div className={cx('workflow-branch', styles.branchClass, className, { 'workflow-branch-dashed': dashed })}>
        <div className="workflow-branch-lines" />
        {controller ? <div className="workflow-branch-controller">{controller}</div> : null}
        <div className="workflow-node-list">
          {start ? <EndSign title={startTitle} /> : null}
          {addable ? <AddNodeSlot aria-label={getAriaLabel()} upstream={from} branchIndex={branchIndex} /> : null}
          {list.map((item) => (
            <Node data={item} key={item.id} />
          ))}
        </div>
        {end ? <EndSign /> : null}
      </div>
    </BranchContext.Provider>
  );
}
