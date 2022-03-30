import { css } from '@emotion/css';
import { Layout } from 'antd';
import React, { useRef, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  CurrentUser,
  CurrentUserProvider,
  findByUid,
  findMenuItem,
  PluginManager,
  RemoteCollectionManagerProvider,
  RemoteSchemaComponent,
  RemoteSchemaTemplateManagerProvider,
  useDocumentTitle,
  useRoute,
  useSystemSettings
} from '../../../';

const InternalAdminLayout = (props: any) => {
  const route = useRoute();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const { setTitle } = useDocumentTitle();
  const sideMenuRef = useRef();
  const defaultSelectedUid = match.params.name;
  const [schema, setSchema] = useState({});
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
          <CurrentUser />
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider style={{ display: 'none' }} theme={'light'} ref={sideMenuRef}></Layout.Sider>
        <Layout.Content style={{ minHeight: 'calc(100vh - 46px)' }}>{props.children}</Layout.Content>
      </Layout>
    </Layout>
  );
};

export const AdminLayout = (props) => {
  return (
    <RemoteSchemaTemplateManagerProvider>
      <RemoteCollectionManagerProvider>
        <CurrentUserProvider>
          <InternalAdminLayout {...props} />
        </CurrentUserProvider>
      </RemoteCollectionManagerProvider>
    </RemoteSchemaTemplateManagerProvider>
  );
};

export default AdminLayout;
