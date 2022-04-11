import { css } from '@emotion/css';
import { Layout } from 'antd';
import React, { useRef, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  ACLAllowConfigure, ACLRolesCheckProvider,
  CurrentUser,
  CurrentUserProvider,
  findByUid,
  findMenuItem,
  PluginManager,
  RemoteCollectionManagerProvider,
  RemoteSchemaComponent,
  RemoteSchemaTemplateManagerProvider,
  useACLRoleContext,
  useDocumentTitle,
  useRoute,
  useSystemSettings
} from '../../../';
import { PoweredBy } from '../../../powered-by';

const filterByACL = (schema, options) => {
  const { allowAll, allowConfigure, allowMenuItemIds = [] } = options;
  if (allowAll || allowConfigure) {
    return schema;
  }
  const filterSchema = (s) => {
    for (const key in s.properties) {
      if (Object.prototype.hasOwnProperty.call(s.properties, key)) {
        const element = s.properties[key];
        if (element['x-uid'] && !allowMenuItemIds.includes(element['x-uid'])) {
          delete s.properties[key];
        }
      }
    }
  };
  filterSchema(schema);
  return schema;
};

const InternalAdminLayout = (props: any) => {
  const route = useRoute();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const { setTitle } = useDocumentTitle();
  const sideMenuRef = useRef();
  const defaultSelectedUid = match.params.name;
  const [schema, setSchema] = useState({});
  const ctx = useACLRoleContext();
  const onSelect = ({ item }) => {
    const schema = item.props.schema;
    console.log('onSelect', schema);
    setSchema(schema);
    setTitle(schema.title);
    history.push(`/admin/${schema['x-uid']}`);
  };
  const [hidden, setHidden] = useState(false);
  const result = useSystemSettings();
  return (
    <Layout>
      <Layout.Header
        className={css`
          .ant-menu.ant-menu-dark .ant-menu-item-selected,
          .ant-menu-submenu-popup.ant-menu-dark .ant-menu-item-selected {
            background-color: rgba(255, 255, 255, 0.1);
          }
          .ant-menu-dark.ant-menu-horizontal > .ant-menu-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
        `}
        style={{ height: 46, lineHeight: '46px', position: 'relative', paddingLeft: 0 }}
      >
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: 200, display: 'inline-flex', color: '#fff', padding: '0', alignItems: 'center' }}>
            <img
              className={css`
                height: 20px;
                padding: 0 16px;
              `}
              src={result?.data?.data?.logo?.url}
            />
            {/* {result?.data?.data?.title} */}
          </div>
          <div
            style={{
              width: 'calc(100% - 590px)',
            }}
          >
            <RemoteSchemaComponent
              hidden={hidden}
              uid={route.uiSchemaUid}
              scope={{ onSelect, sideMenuRef, defaultSelectedUid }}
              schemaTransform={(data) => {
                if (!data) {
                  return data;
                }
                data['x-component-props'] = data['x-component-props'] || {};
                data['x-component-props']['defaultSelectedUid'] = defaultSelectedUid;
                filterByACL(data, ctx);
                return data;
              }}
              onSuccess={(data) => {
                if (defaultSelectedUid) {
                  const s = findByUid(data?.data, defaultSelectedUid);
                  if (s) {
                    setTitle(s.title);
                  }
                  return;
                }
                setHidden(true);
                setTimeout(() => setHidden(false), 11);
                const s = findMenuItem(data?.data);
                if (s) {
                  setSchema(s);
                  setTitle(s.title);
                  history.push(`/admin/${s['x-uid']}`);
                }
              }}
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <ACLAllowConfigure>
            <PluginManager.Toolbar
              items={[
                { component: 'DesignableSwitch', pin: true },
                { component: 'CollectionManagerShortcut', pin: true },
                { component: 'ACLShortcut', pin: true },
                { component: 'WorkflowShortcut', pin: true },
                { component: 'SchemaTemplateShortcut', pin: true },
                { component: 'SystemSettingsShortcut' },
              ]}
            />
          </ACLAllowConfigure>
          <CurrentUser />
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider style={{ display: 'none' }} theme={'light'} ref={sideMenuRef}></Layout.Sider>
        <Layout.Content
          className={css`
            min-height: calc(100vh - 46px);
            position: relative;
            padding-bottom: 70px;
            .ant-layout-footer {
              position: absolute;
              bottom: 0;
              text-align: center;
              width: 100%;
            }
          `}
        >
          {props.children}
          <Layout.Footer>
            <PoweredBy />
          </Layout.Footer>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export const AdminLayout = (props) => {
  return (
    <CurrentUserProvider>
      <RemoteSchemaTemplateManagerProvider>
        <RemoteCollectionManagerProvider>
          <ACLRolesCheckProvider>
            <InternalAdminLayout {...props} />
          </ACLRolesCheckProvider>
        </RemoteCollectionManagerProvider>
      </RemoteSchemaTemplateManagerProvider>
    </CurrentUserProvider>
  );
};

export default AdminLayout;
