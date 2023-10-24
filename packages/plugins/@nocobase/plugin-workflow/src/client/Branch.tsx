import { cx } from '@nocobase/client';
import React from 'react';
import { AddButton } from './AddButton';
import { Node } from './nodes';
import useStyles from './style';

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  controller?: any;
}) {
  const { styles } = useStyles();
  const ariaLabel = ['add-button', from?.type, from?.title, branchIndex != null ? String(branchIndex) : '']
    .filter(Boolean)
    .join('-');

  const list: any[] = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <div className={cx(styles.branchClass)}>
      <div className="workflow-branch-lines" />
      {controller}
      <AddButton aria-label={ariaLabel} upstream={from} branchIndex={branchIndex} />
      <div className="workflow-node-list">
        {list.map((item) => (
          <Node data={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
