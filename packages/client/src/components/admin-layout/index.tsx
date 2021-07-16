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

import { uid } from '@formily/shared';
import { ISchema } from '@formily/react';
import datatable from './datatable';

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
      <Layout.Header style={{ display: 'flex' }}>
        <SchemaRenderer
          schema={schema}
          scope={{
            sideMenuRef,
            onSelect,
            selectedKeys: [activeKey].filter(Boolean),
          }}
        />
        <SchemaRenderer schema={datatable} />
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
    `ui_schemas:getTree?filter[parentKey]=${activeKey}`,
    {
      refreshDeps: [activeKey],
      formatResult: (result) => result?.data,
    },
  );

  if (loading) {
    return <Spin />;
  }

  const schema: ISchema = {
    type: 'void',
    name: uid(),
    'x-component': 'Grid',
    properties: {
      [`row_${uid()}`]: {
        type: 'void',
        'x-component': 'Grid.Row',
        properties: {
          [`col_${uid()}`]: {
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              [uid()]: {
                type: 'void',
                'x-component': 'AddNew.BlockItem',
              },
            },
          },
        },
      },
    },
  };

  return <SchemaRenderer schema={schema} />;
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
