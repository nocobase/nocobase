import React, { useRef, useState } from 'react';
import { Layout, Spin } from 'antd';
import { useRoute } from '../..';
import { findMenuItem, RemoteSchemaComponent } from '../../../schema-component';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';

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
      <Layout.Header>
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
