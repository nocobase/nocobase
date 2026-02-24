import React from 'react';
import { Tree } from '@nocobase/plugin-block-tree/client';

interface TreeNode {
  nickname: string;
  id: string;
  customChildren?: TreeNode[];
}

const x = 3;
const y = 2;
const z = 1;
const treeData: TreeNode[] = [];

const generateData = (_level: number, _preKey?: React.Key, _tns?: TreeNode[]) => {
  const preKey = _preKey || '0';
  const tns = _tns || treeData;

  const customChildren: React.Key[] = [];
  for (let i = 0; i < x; i++) {
    const key = `${preKey}-${i}`;
    tns.push({ nickname: key, id: key });
    if (i < y) {
      customChildren.push(key);
    }
  }
  if (_level < 0) {
    return tns;
  }
  const level = _level - 1;
  customChildren.forEach((key, index) => {
    tns[index].customChildren = [];
    return generateData(level, key, tns[index].customChildren);
  });
};
generateData(z);

const App: React.FC = () => {
  return (
    <Tree treeData={treeData as any} fieldNames={{ title: 'nickname', key: 'id', children: 'customChildren' }} />
  );
};

export default App;
