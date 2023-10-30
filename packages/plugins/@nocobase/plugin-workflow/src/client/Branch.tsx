import React from 'react';
import { CloseOutlined } from '@ant-design/icons';

import { css, cx } from '@nocobase/client';

import { AddButton } from './AddButton';
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
      <AddButton aria-label={getAriaLabel()} upstream={from} branchIndex={branchIndex} />
      <div className="workflow-node-list">
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
