import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Button,
  Spin,
  Layout,
  PageHeader,
  Modal,
  Menu,
  Collapse,
  Dropdown,
} from 'antd';
import isEmpty from 'lodash/isEmpty';
import {
  Link,
  useLocation,
  useRouteMatch,
  useHistory,
  Redirect,
} from 'react-router-dom';
import { SchemaRenderer } from '../../schemas';
import { useRequest } from 'ahooks';
import './style.less';

function LayoutWithMenu({ schema }) {
  const match = useRouteMatch<any>();
  const location = useLocation();
  const sideMenuRef = useRef();
  const [activeKey, setActiveKey] = useState(match.params.name);
  const onSelect = (info) => {
    console.log('LayoutWithMenu', schema);
    setActiveKey(info.key);
  };
  console.log({ match });
  return (
    <Layout>
      <Layout.Header>
        <SchemaRenderer
          schema={schema}
          scope={{
            sideMenuRef,
            onSelect,
            selectedKeys: [activeKey].filter(Boolean),
          }}
        />
      </Layout.Header>
      <Layout>
        <Layout.Sider
          ref={sideMenuRef}
          theme={'light'}
          width={200}
        ></Layout.Sider>
        <Layout.Content>
          {activeKey && <Content activeKey={activeKey} />}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

function Content({ activeKey }) {
  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree/${activeKey}?filter[parentId]=${activeKey}`,
    {
      refreshDeps: [activeKey],
      formatResult: (result) => result?.data,
    },
  );

  if (loading) {
    return <Spin />;
  }

  return <SchemaRenderer schema={data} />;
}

export function AdminLayout({ route }: any) {
  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree/${route.uiSchemaKey}`,
    {
      refreshDeps: [route],
      formatResult: (result) => result?.data,
    },
  );

  if (loading) {
    return <Spin />;
  }

  return <LayoutWithMenu schema={data} />;
}

export default AdminLayout;
