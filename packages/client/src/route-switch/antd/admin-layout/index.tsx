import React, { useRef, useState } from 'react';
import { Button, Layout } from 'antd';
import { useRoute } from '../../hooks';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { findMenuItem, RemoteSchemaComponent, PluginManager, CurrentUser } from '../../../';

export function AdminLayout(props: any) {
  const route = useRoute();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const sideMenuRef = useRef();
  const defaultSelectedUid = match.params.name;
  const [schema, setSchema] = useState({});
  const onSelect = ({ item }) => {
    const schema = item.props.schema;
    setSchema(schema);
    history.push(`/admin/${schema['x-uid']}`);
  };
  const [hidden, setHidden] = useState(false);
  return (
    <Layout>
      <Layout.Header style={{ position: 'relative' }}>
        <div>
          <RemoteSchemaComponent
            hidden={hidden}
            uid={route.uiSchemaUid}
            scope={{ onSelect, sideMenuRef, defaultSelectedUid }}
            schemaTransform={(data) => {
              data['x-component-props']['defaultSelectedUid'] = defaultSelectedUid;
              return data;
            }}
            onSuccess={(data) => {
              if (defaultSelectedUid) {
                return;
              }
              setHidden(true);
              setTimeout(() => setHidden(false), 11);
              const s = findMenuItem(data?.data);
              if (s) {
                setSchema(s);
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
          <CurrentUser.Dropdown/>
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider style={{ display: 'none' }} theme={'light'} ref={sideMenuRef}></Layout.Sider>
        <Layout.Content>
          <RemoteSchemaComponent uid={match.params.name} />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
