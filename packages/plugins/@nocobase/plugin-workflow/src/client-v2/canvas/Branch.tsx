/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas branch column (doc §9.6). A second copy of v1 `Branch` — same
 * DOM/flexbox structure and stylesheet, but rendering the v2 `<Node>` and using
 * the v2 contexts. Branch nodes recurse by self-rendering nested `<Branch>` from
 * their `ComponentLoader` (the modern render-extension point).
 */

import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Node } from './Node';
import { AddNodeSlot } from './AddNodeSlot';
import { BranchContext } from './BranchContext';
import { useBranchNodeRenderer } from './BranchRenderContext';
import useStyles from './style';

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
  NodeComponent,
  addButtonAriaLabel,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  controller?: React.ReactNode;
  className?: string;
  end?: true | React.ReactNode | null;
  addable?: boolean;
  syncOnly?: boolean;
  start?: boolean;
  startTitle?: React.ReactNode;
  dashed?: boolean;
  NodeComponent?: React.ComponentType<{ data: any }>;
  addButtonAriaLabel?: string;
}) {
  const { styles, cx } = useStyles();
  const injectedNodeRenderer = useBranchNodeRenderer();
  const ResolvedNodeComponent = NodeComponent ?? injectedNodeRenderer ?? Node;
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
          {addable ? <AddNodeSlot aria-label={addButtonAriaLabel} upstream={from} branchIndex={branchIndex} /> : null}
          {list.map((item) => (
            <ResolvedNodeComponent data={item} key={item.id} />
          ))}
        </div>
        {end === true ? <EndSign /> : end}
      </div>
    </BranchContext.Provider>
  );
}
