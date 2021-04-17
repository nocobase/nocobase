import React, { useEffect, useState, ReactNode, ComponentProps } from 'react';
import { Tree } from 'antd';
import { TreeProps } from 'antd/es/tree';
import './Tree.less';

function getTreeFromList(nodes: ReactNode, prefix = '') {
  const data: TreeProps['treeData'] = [];

  [].concat(nodes).forEach((node, i) => {
    const key = `${prefix ? `${prefix}-` : ''}${i}`;

    switch (node.type) {
      case 'ul':
        const parent = data[data.length - 1]?.children || data;
        const ulLeafs = getTreeFromList(node.props.children || [], key);

        parent.push(...ulLeafs);
        break;

      case 'li':
        const liLeafs = getTreeFromList(node.props.children, key);

        data.push({
          title: [].concat(node.props.children).filter(child => child.type !== 'ul'),
          key,
          children: liLeafs,
          isLeaf: !liLeafs.length,
        });
        break;

      default:
    }
  });

  return data;
}

const useListToTree = (nodes: ReactNode) => {
  const [tree, setTree] = useState(getTreeFromList(nodes));

  useEffect(() => {
    setTree(getTreeFromList(nodes));
  }, [nodes]);

  return tree;
};

export default (props: ComponentProps<'div'>) => {
  const data = useListToTree(props.children);

  return (
    <Tree.DirectoryTree
      className="__dumi-site-tree"
      showLine={{ showLeafIcon: false }}
      selectable={false}
      treeData={[{ key: '0', title: props.title || '<root>', children: data }]}
      defaultExpandAll
    />
  );
};