/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext } from 'react';
import { CloseOutlined } from '@ant-design/icons';

import { css, cx } from '@nocobase/client';

import { AddNodeSlot } from './AddNodeContext';
import { useGetAriaLabelOfAddButton } from './hooks/useGetAriaLabelOfAddButton';
import { Node } from './nodes';
import useStyles from './style';

export const BranchIndexContext = createContext(null);

export function useBranchIndex() {
  return React.useContext(BranchIndexContext);
}

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null,
  className,
  end,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  controller?: React.ReactNode;
  className?: string;
  end?: boolean;
}) {
  const { styles } = useStyles();
  const { getAriaLabel } = useGetAriaLabelOfAddButton(from, branchIndex);
  const list: any[] = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <BranchIndexContext.Provider value={branchIndex}>
      <div className={cx('workflow-branch', styles.branchClass, className)}>
        <div className="workflow-branch-lines" />
        {controller ? <div className="workflow-branch-controller">{controller}</div> : null}
        <div className="workflow-node-list">
          <AddNodeSlot aria-label={getAriaLabel()} upstream={from} branchIndex={branchIndex} />
          {list.map((item) => (
            <Node data={item} key={item.id} />
          ))}
        </div>
        {end ? (
          <div className="end-sign">
            <CloseOutlined />
          </div>
        ) : null}
      </div>
    </BranchIndexContext.Provider>
  );
}
