/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  RecordProvider,
  SchemaComponent,
  useAPIClient,
  useResourceActionContext,
} from '@nocobase/client';
import { Menu, Empty, Dropdown, App, Tag, Row, Col, Spin } from 'antd';
import { TagOutlined, MoreOutlined } from '@ant-design/icons';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useACLTranslation } from './locale';
import { Schema } from '@formily/react';
import { RolesManagerContext } from './RolesManagerProvider';
import { roleEditSchema } from './schemas/roles';
import { useLoadMoreObserver } from './hooks/load-more-observer';

export const RolesMenu: React.FC & {
  Item: React.FC<{ item: any; onEdit: () => void }>;
} = () => {
  const { t } = useACLTranslation();
  const { data, mutate } = useResourceActionContext();
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const { role, setRole } = useContext(RolesManagerContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useAPIClient();

  const loadMore = useCallback(async () => {
    const meta = data?.meta;
    if (!meta || meta.page >= meta.totalPage) {
      return;
    }
    setLoading(true);
    const res = await api.resource('roles').list({
      page: meta.page + 1,
      pageSize: meta.pageSize,
      filter: {
        'name.$ne': 'root',
      },
      showAnonymous: true,
      sort: ['createdAt'],
      appends: [],
    });
    mutate(res?.data || {});
    setLoading(false);
  }, [data]);
  const { lastItem, setLastItem } = useLoadMoreObserver({ loadMore });

  const handleSelect = ({ key }) => {
    setRole(roles.find((item: any) => item.name === key));
  };

  useEffect(() => {
    if (!roles[0]) {
      return;
    }
    setRole(roles[0]);
  }, [roles, setRole]);

  useEffect(() => {
    if (!data?.data?.length) {
      return;
    }

    const ref = React.createRef<any>();
    setLastItem(ref);

    if (data.meta?.page > 1) {
      setRoles((prev) => prev.concat(data.data));
    } else {
      setRoles(data.data);
    }
  }, [data, setLastItem]);

  const items = useMemo(
    () =>
      roles.map((item: any, index: number) => ({
        key: item.name,
        label:
          index === roles.length - 1 ? (
            <div ref={lastItem}>
              <RolesMenu.Item
                item={item}
                onEdit={() => {
                  setVisible(true);
                  setRecord(item);
                }}
              />
            </div>
          ) : (
            <RolesMenu.Item
              item={item}
              onEdit={() => {
                setVisible(true);
                setRecord(item);
              }}
            />
          ),
      })),
    [roles, lastItem],
  );

  return (
    <>
      {roles.length ? (
        <Menu
          style={{ border: 'none', maxHeight: '65vh', overflowY: 'auto' }}
          items={[...items, ...(loading ? [{ key: 'loading', label: <Spin /> }] : [])]}
          selectedKeys={[role?.name]}
          onSelect={handleSelect}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <ActionContextProvider value={{ visible, setVisible }}>
        <RecordProvider record={record} collectionName="departments">
          <SchemaComponent scope={{ t }} schema={roleEditSchema} />
        </RecordProvider>
      </ActionContextProvider>
    </>
  );
};

RolesMenu.Item = function DepartmentTreeItem({ item, onEdit }) {
  const { t } = useACLTranslation();
  const { refreshAsync } = useResourceActionContext();
  const { modal, message } = App.useApp();
  const api = useAPIClient();
  const deleteDepartment = () => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      onOk: async () => {
        await api.resource('roles').destroy({ filterByTk: item.name });
        message.success(t('Deleted successfully'));
        await refreshAsync();
      },
    });
  };
  const handleClick = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    switch (key) {
      case 'edit':
        onEdit();
        break;
      case 'delete':
        deleteDepartment();
    }
  };
  const title = Schema.compile(item.title, { t });
  return (
    <Row>
      <Col
        flex={3}
        style={{ display: 'inline-flex', alignItems: 'center', flex: '1 1 0', minWidth: 0, paddingRight: '8px' }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
          <TagOutlined />
          <span style={{ marginLeft: '10px' }} title={title}>
            {title}
          </span>
        </span>
      </Col>
      <Col>
        {item.default ? (
          <Tag color="success" bordered={false}>
            {t('Default')}
          </Tag>
        ) : null}
        <Dropdown
          menu={{
            items: [
              {
                label: t('Edit'),
                key: 'edit',
              },
              {
                label: t('Delete'),
                key: 'delete',
              },
            ],
            onClick: handleClick,
          }}
        >
          <MoreOutlined />
        </Dropdown>
      </Col>
    </Row>
  );
};
