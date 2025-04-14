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

import React, { useContext, useEffect } from 'react';
import { Tree, Dropdown, App, Empty } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useAPIClient, useResourceActionContext } from '@nocobase/client';
import { useDepartmentTranslation } from '../locale';
import { editDepartmentSchema, newSubDepartmentSchema } from './schemas/departments';
import { ResourcesContext } from '../ResourcesProvider';
import { DepartmentTreeContext } from './Department';
import { css } from '@emotion/css';

type DepartmentTreeProps = {
  node: {
    id: number;
    title: string;
    parent?: any;
  };
  setVisible: (visible: boolean) => void;
  setDrawer: (schema: any) => void;
};

export const DepartmentTree: React.FC & {
  Item: React.FC<DepartmentTreeProps>;
} = () => {
  const { data, loading } = useResourceActionContext();
  const { department, setDepartment, setUser } = useContext(ResourcesContext);
  const { treeData, nodeMap, loadData, loadedKeys, setLoadedKeys, initData, expandedKeys, setExpandedKeys } =
    useContext(DepartmentTreeContext);
  const handleSelect = (keys: number[]) => {
    if (!keys.length) {
      return;
    }
    const node = nodeMap[keys[0]];
    setDepartment(node);
    setUser(null);
  };

  const handleExpand = (keys: number[]) => {
    setExpandedKeys(keys);
  };

  const handleLoad = (keys: number[]) => {
    setLoadedKeys(keys);
  };

  useEffect(() => {
    initData(data?.data);
  }, [data, initData, loading]);

  useEffect(() => {
    if (!department) {
      return;
    }
    const getIds = (node: any) => {
      if (node.parent) {
        return [node.parent.id, ...getIds(node.parent)];
      }
      return [];
    };
    const newKeys = getIds(department);
    setExpandedKeys((keys) => Array.from(new Set([...keys, ...newKeys])));
  }, [department, setExpandedKeys]);

  return (
    <div
      className={css`
        height: 65vh;
        overflow: auto;
        .ant-tree-node-content-wrapper {
          overflow: hidden;
        }
      `}
    >
      {treeData?.length ? (
        <Tree.DirectoryTree
          loadData={loadData}
          treeData={treeData}
          loadedKeys={loadedKeys}
          onSelect={handleSelect}
          selectedKeys={[department?.id]}
          onExpand={handleExpand}
          onLoad={handleLoad}
          expandedKeys={expandedKeys}
          expandAction={false}
          showIcon={false}
          fieldNames={{
            key: 'id',
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

DepartmentTree.Item = function DepartmentTreeItem({ node, setVisible, setDrawer }: DepartmentTreeProps) {
  const { t } = useDepartmentTranslation();
  const { refreshAsync } = useResourceActionContext();
  const { setLoadedKeys, expandedKeys, setExpandedKeys } = useContext(DepartmentTreeContext);
  const { modal, message } = App.useApp();
  const api = useAPIClient();
  const deleteDepartment = () => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      onOk: async () => {
        await api.resource('departments').destroy({ filterByTk: node.id });
        message.success(t('Deleted successfully'));
        setExpandedKeys((keys) => keys.filter((k) => k !== node.id));
        const expanded = [...expandedKeys];
        setLoadedKeys([]);
        setExpandedKeys([]);
        await refreshAsync();
        setExpandedKeys(expanded);
      },
    });
  };
  const openDrawer = (schema: any) => {
    setDrawer({ schema, node });
    setVisible(true);
  };
  const handleClick = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    switch (key) {
      case 'new-sub':
        openDrawer(newSubDepartmentSchema);
        break;
      case 'edit':
        openDrawer(editDepartmentSchema);
        break;
      case 'delete':
        deleteDepartment();
    }
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', overflow: 'hidden' }}>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.title}</div>
      <Dropdown
        menu={{
          items: [
            {
              label: t('New sub department'),
              key: 'new-sub',
            },
            {
              label: t('Edit department'),
              key: 'edit',
            },
            {
              label: t('Delete department'),
              key: 'delete',
            },
          ],
          onClick: handleClick,
        }}
      >
        <div style={{ marginLeft: '15px' }}>
          <MoreOutlined />
        </div>
      </Dropdown>
    </div>
  );
};
