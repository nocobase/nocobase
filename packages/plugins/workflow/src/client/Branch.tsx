import React from "react";
import { cx } from '@emotion/css';
import { branchClass } from "./style";
import { AddButton } from "./AddButton";
import { Node } from './nodes';

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null
}) {
  const list = [];
  for (let node = entry; node; node = node.downstream) {
    list.push(node);
  }

  return (
    <div className={cx(branchClass)}>
      <div className="workflow-branch-lines" />
      {controller}
      <AddButton upstream={from} branchIndex={branchIndex} />
      <div className="workflow-node-list">
        {list.map(item => <Node data={item} key={item.id} />)}
      </div>
    </div>
  );
}
