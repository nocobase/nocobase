import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Divider } from 'antd';
import {
  CollectionProvider,
  CollectionProvider_deprecated,
  ResourceActionProvider,
  SchemaComponentContext,
  usePlugin,
  useSchemaComponentContext,
} from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import { RolesMenu } from './RolesMenu';
import { useACLTranslation } from './locale';
import ACLPlugin from '.';
import { RolesManagerContext } from './RolesManagerProvider';
import { Permissions } from './permissions/Permissions';
import { NewRole } from './NewRole';

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
  const [activeKey, setActiveKey] = React.useState('permissions');
  const tabs = Array.from(aclPlugin.rolesManager.list()).map(([name, item]) => ({
    key: name,
    label: Schema.compile(item.title, { t }),
    children: item.Component ? React.createElement(item.Component, { active: activeKey === name }) : null,
  }));
  const [role, setRole] = useState(null);
  const scCtx = useSchemaComponentContext();

  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <RolesManagerContext.Provider value={{ role, setRole }}>
        <Card>
          <Row gutter={24} style={{ flexWrap: 'nowrap' }}>
            <Col flex="280px" style={{ borderRight: '1px solid #eee', minWidth: '250px' }}>
              <ResourceActionProvider
                collection={collection}
                request={{
                  resource: 'roles',
                  action: 'list',
                  params: {
                    filter: {
                      'name.$ne': 'root',
                    },
                    showAnonymous: true,
                    sort: ['createdAt'],
                    appends: [],
                  },
                }}
              >
                <CollectionProvider_deprecated collection={collection}>
                  <Row>
                    <NewRole />
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <RolesMenu />
                </CollectionProvider_deprecated>
              </ResourceActionProvider>
            </Col>
            <Col flex="auto" style={{ overflow: 'hidden' }}>
              <Tabs
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                items={[
                  {
                    key: 'permissions',
                    label: t('Permissions'),
                    children: <Permissions active={activeKey === 'permissions'} />,
                  },
                  ...tabs,
                ]}
              />
            </Col>
          </Row>
        </Card>
      </RolesManagerContext.Provider>
    </SchemaComponentContext.Provider>
  );
};
