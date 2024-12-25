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

import { css, cx } from '@nocobase/client';

import { AddButton } from './AddNodeContext';
import { useGetAriaLabelOfAddButton } from './hooks/useGetAriaLabelOfAddButton';
import { Node } from './nodes';
import useStyles from './style';

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
    <div className={cx('workflow-branch', styles.branchClass, className)}>
      <div className="workflow-branch-lines" />
      {controller}
      <div className="workflow-node-list">
        <AddButton aria-label={getAriaLabel()} upstream={from} branchIndex={branchIndex} />
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
  );
}
