import {
  ActionContextProvider,
  RecordProvider,
  SchemaComponent,
  useAPIClient,
  useResourceActionContext,
} from '@nocobase/client';
import { Menu, Empty, Dropdown, App, Tag, Row, Col } from 'antd';
import { TagOutlined, MoreOutlined } from '@ant-design/icons';
import React, { useContext, useEffect } from 'react';
import { useACLTranslation } from './locale';
import { Schema } from '@formily/react';
import { RolesManagerContext } from './RolesManagerProvider';
import { roleEditSchema } from './schemas/roles';

export const RolesMenu: React.FC & {
  Item: React.FC<{ item: any; onEdit: () => void }>;
} = () => {
  const { t } = useACLTranslation();
  const { data } = useResourceActionContext();
  const [visible, setVisible] = React.useState(false);
  const [record, setRecord] = React.useState(null);
  const { role, setRole } = useContext(RolesManagerContext);
  const items = (data?.data || []).map((item: any) => ({
    key: item.name,
    label: (
      <RolesMenu.Item
        item={item}
        onEdit={() => {
          setVisible(true);
          setRecord(item);
        }}
      />
    ),
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

  return (
    <>
      {items.length ? (
        <Menu
          style={{ border: 'none', maxHeight: '65vh', overflowY: 'auto' }}
          items={items}
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
  return (
    <Row>
      <Col flex={3} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ whiteSpace: 'nowrap', width: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <TagOutlined />
          <span style={{ marginLeft: '10px' }}>{Schema.compile(item.title, { t })}</span>
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
