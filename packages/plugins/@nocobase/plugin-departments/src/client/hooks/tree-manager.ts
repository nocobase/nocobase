/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useCallback, useState } from 'react';

export type TreeManagerOptions = {
  label?: React.FC<{ node: any }>;
};

export const useTreeManager = (options?: TreeManagerOptions) => {
  const { label } = options || {};
  const [treeData, setTreeData] = useState([]);
  const [nodeMap, setNodeMap] = useState({});
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loadedKeys, setLoadedKeys] = useState([]);

  const buildNodeMap = useCallback((data: any[]) => {
    const mp = {};
    const setNodeMapFromChild = (node: any) => {
      let child = node ? { ...node } : null;
      while (child) {
        const parentId = child.parentId || 'root';
        if (mp[parentId]) {
          mp[parentId].childrenMap[child.id] = child;
        } else {
          mp[parentId] = {
            ...(child.parent || { id: parentId }),
            childrenMap: {
              [child.id]: child,
            },
          };
        }
        child = child.parent;
      }
    };
    const setNodeMapFromParent = (node: any) => {
      const childrenMap = {};
      if (node.children && node.children.length) {
        node.children.forEach((child: any) => {
          childrenMap[child.id] = child;
          setNodeMapFromParent(child);
        });
      }
      mp[node.id] = {
        ...node,
        childrenMap,
      };
    };
    if (!(data && data.length)) {
      return mp;
    }
    data.forEach((node) => {
      setNodeMapFromChild(node);
      setNodeMapFromParent(node);
    });
    return mp;
  }, []);

  const constructTreeData = useCallback((nodeMap: { [parentId: string | number]: any }) => {
    const getChildren = (id: any) => {
      if (!nodeMap[id]) {
        return null;
      }
      if (nodeMap[id].isLeaf) {
        return null;
      }
      return Object.values(nodeMap[id]?.childrenMap || {}).map((node: any) => {
        return {
          ...node,
          title: label ? React.createElement(label, { node }) : node.title,
          children: getChildren(node.id),
        };
      });
    };
    return getChildren('root');
  }, []);

  const initData = useCallback(
    (data: any[]) => {
      const mp = buildNodeMap(data);
      setNodeMap(mp);
      const treeData = constructTreeData(mp) || [];
      setTreeData(treeData);
      // setLoadedKeys([]);
    },
    [setTreeData, buildNodeMap, constructTreeData],
  );

  const updateTreeData = (key: any, children: any[]) => {
    const mp = buildNodeMap(children);
    const newMap = { ...mp, ...nodeMap };
    children.forEach((node) => {
      newMap[key].childrenMap[node.id] = node;
    });
    setNodeMap(newMap);
    return constructTreeData(newMap);
  };

  const getChildrenIds = useCallback(
    (id: any) => {
      if (!nodeMap[id]) {
        return [];
      }
      const ids = [];
      ids.push(...Object.keys(nodeMap[id].childrenMap).map((id) => Number(id)));
      Object.keys(nodeMap[id].childrenMap).forEach((id) => {
        ids.push(...getChildrenIds(id));
      });
      return ids;
    },
    [nodeMap],
  );

  return {
    initData,
    treeData,
    setTreeData,
    nodeMap,
    updateTreeData,
    constructTreeData,
    getChildrenIds,
    loadedKeys,
    setLoadedKeys,
    expandedKeys,
    setExpandedKeys,
  };
};
