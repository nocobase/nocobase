import { useAPIClient, useResourceActionContext } from '@nocobase/client';
import { Menu, Empty, Dropdown, App, Tag } from 'antd';
import { TagOutlined, MoreOutlined } from '@ant-design/icons';
import React, { useContext, useEffect } from 'react';
import { useACLTranslation } from './locale';
import { Schema } from '@formily/react';
import { RolesManagerContext } from './RolesManagerProvider';

export const RolesMenu: React.FC & {
  Item: React.FC<{ item: any }>;
} = () => {
  const { data } = useResourceActionContext();
  const { role, setRole } = useContext(RolesManagerContext);
  const items = (data?.data || []).map((item: any) => ({
    key: item.name,
    label: <RolesMenu.Item item={item} />,
  }));

  const handleSelect = ({ key }) => {
    setRole((data?.data || []).find((item: any) => item.name === key));
  };

  useEffect(() => {
    if (!data?.data.length) {
      return;
    }
    setRole(data?.data[0]);
  }, [data, setRole]);

  return items.length ? (
    <Menu style={{ border: 'none' }} items={items} selectedKeys={[role?.name]} onSelect={handleSelect} />
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
};

RolesMenu.Item = function DepartmentTreeItem({ item }) {
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
      case 'delete':
        deleteDepartment();
    }
  };
  return (
    <>
      <TagOutlined />
      <span style={{ marginLeft: '10px' }}>{Schema.compile(item.title, { t })}</span>
      {item.default ? (
        <Tag style={{ marginLeft: '10px' }} color="success" bordered={false}>
          {t('Default')}
        </Tag>
      ) : null}
      <Dropdown
        menu={{
          items: [
            {
              label: t('Configure'),
              key: 'configure',
            },
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
        <div style={{ float: 'right' }}>
          <MoreOutlined />
        </div>
      </Dropdown>
    </>
  );
};
