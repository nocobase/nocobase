import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Button, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CollectionProvider, ResourceActionProvider, usePlugin } from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import { RolesMenu } from './RolesMenu';
import { useACLTranslation } from './locale';
import ACLPlugin from '.';
import { RolesManagerContext } from './RolesManagerProvider';
import { RoleConfigure } from './permissions/RoleConfigure';
import { Permissions } from './permissions/Permissions';

const collection = {
  name: 'roles',
  filterTargetKey: 'name',
  targetKey: 'name',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Role display name")}}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{t("Role UID")}}',
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'default',
      interface: 'boolean',
      uiSchema: {
        title: '{{t("Default role")}}',
        type: 'boolean',
        'x-component': 'Checkbox',
      } as ISchema,
    },
  ],
};

export const RolesManagement: React.FC = () => {
  const { t } = useACLTranslation();
  const aclPlugin = usePlugin(ACLPlugin);
  const tabs = Array.from(aclPlugin.rolesManager.list()).map(([name, item]) => ({
    key: name,
    label: Schema.compile(item.title, { t }),
    children: item.Component ? React.createElement(item.Component) : null,
  }));
  const [role, setRole] = useState(null);

  return (
    <RolesManagerContext.Provider value={{ role, setRole }}>
      <Card>
        <Row gutter={24}>
          <Col span={5} style={{ borderRight: '1px solid #eee' }}>
            <ResourceActionProvider
              collection={collection}
              request={{
                resource: 'roles',
                action: 'list',
                params: {
                  pagination: false,
                  filter: {
                    'name.$ne': 'root',
                  },
                  showAnonymous: true,
                  sort: ['createdAt'],
                  appends: [],
                },
              }}
            >
              <CollectionProvider collection={collection}>
                <Row>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    style={{
                      textAlign: 'left',
                      marginBottom: '5px',
                    }}
                    block
                  >
                    {t('New role')}
                  </Button>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <RolesMenu />
              </CollectionProvider>
            </ResourceActionProvider>
          </Col>
          <Col span={19}>
            <Tabs
              items={[
                {
                  key: 'permissions',
                  label: t('Permissions'),
                  children: <Permissions />,
                },
                ...tabs,
              ]}
            />
          </Col>
        </Row>
      </Card>
    </RolesManagerContext.Provider>
  );
};
