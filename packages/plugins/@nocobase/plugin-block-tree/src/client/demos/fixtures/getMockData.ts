import type { TreeDataNode } from 'antd';

const x = 3;
const y = 2;
const z = 1;

export function getMockData() {
  const treeData: TreeDataNode[] = [];

  const generateData = (_level: number, _preKey?: React.Key, _tns?: TreeDataNode[]) => {
    const preKey = _preKey || '0';
    const tns = _tns || treeData;

    const children: React.Key[] = [];
    for (let i = 0; i < x; i++) {
      const key = `${preKey}-${i}`;
      tns.push({ title: key, key });
      if (i < y) {
        children.push(key);
      }
    }
    if (_level < 0) {
      return tns;
    }
    const level = _level - 1;
    children.forEach((key, index) => {
      tns[index].children = [];
      return generateData(level, key, tns[index].children);
    });
  };

  generateData(z);

  return treeData;
}
