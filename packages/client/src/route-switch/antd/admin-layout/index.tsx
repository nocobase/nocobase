import React, { useState } from 'react';
import { Layout, Spin } from 'antd';
import { useRoute } from '../..';
import { RemoteSchemaComponent } from '../../../schema-component';
import { useHistory, useRouteMatch } from 'react-router-dom';

export function AdminLayout(props: any) {
  const route = useRoute();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const defaultSelectedUid = match.params.name;
  const [schema, setSchema] = useState({});
  const onSelect = ({ item }) => {
    const schema = item.props.schema;
    setSchema(schema);
    history.push(`/admin/${schema['x-uid']}`);
  };
  return (
    <Layout>
      <Layout.Header>
        <RemoteSchemaComponent scope={{ onSelect, defaultSelectedUid }} uid={route.uiSchemaUid} />
      </Layout.Header>
      <Layout>
        <Layout.Content>
          <RemoteSchemaComponent uid={match.params.name} />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
