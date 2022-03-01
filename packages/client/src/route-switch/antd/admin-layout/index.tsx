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
  RemoteSchemaComponent,
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
      <Layout.Header style={{ height: 46, lineHeight: '46px', position: 'relative', paddingLeft: 0 }}>
        <div style={{ display: 'flex' }}>
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
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <PluginManager.Toolbar
            items={[
              { component: 'DesignableSwitch', pin: true },
              { component: 'CollectionManagerShortcut', pin: true },
              { component: 'ACLShortcut', pin: true },
              { component: 'SystemSettingsShortcut' },
            ]}
          />
          <CurrentUser />
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider style={{ display: 'none' }} theme={'light'} ref={sideMenuRef}></Layout.Sider>
        <Layout.Content style={{ minHeight: 'calc(100vh - 46px)' }}>
          <RemoteSchemaComponent onlyRenderProperties uid={match.params.name} />
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export const AdminLayout = () => {
  return (
    <CurrentUserProvider>
      <InternalAdminLayout />
    </CurrentUserProvider>
  );
};

export default AdminLayout;
