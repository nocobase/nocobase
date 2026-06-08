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
  className,
  end,
  addable = true,
  start = false,
  startTitle,
  dashed = false,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  className?: string;
  end?: boolean;
  addable?: boolean;
  start?: boolean;
  startTitle?: React.ReactNode;
  dashed?: boolean;
}) {
  const { styles, cx } = useStyles();
  const list: any[] = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <BranchContext.Provider value={{ branchIndex, addable }}>
      <div className={cx('workflow-branch', styles.branchClass, className, { 'workflow-branch-dashed': dashed })}>
        <div className="workflow-branch-lines" />
        <div className="workflow-node-list">
          {start ? <EndSign title={startTitle} /> : null}
          {addable ? <AddNodeSlot upstream={from} branchIndex={branchIndex} /> : null}
          {list.map((item) => (
            <Node data={item} key={item.id} />
          ))}
        </div>
        {end ? <EndSign /> : null}
      </div>
    </BranchContext.Provider>
  );
}
