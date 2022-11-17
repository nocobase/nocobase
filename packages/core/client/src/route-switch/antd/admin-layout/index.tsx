import { css } from '@emotion/css';
import { Layout, Spin } from 'antd';
import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  ACLAllowConfigure,
  ACLRolesCheckProvider,
  CurrentUser,
  CurrentUserProvider,
  CurrentAppInfoProvider,
  findByUid,
  findMenuItem,
  RemoteCollectionManagerProvider,
  RemotePluginManagerToolbar,
  RemoteSchemaTemplateManagerProvider,
  SchemaComponent,
  useACLRoleContext,
  useDocumentTitle,
  useRequest,
  useRoute,
  useSystemSettings,
} from '../../../';
import { useCollectionManager } from '../../../collection-manager';
import { PoweredBy } from '../../../powered-by';

const filterByACL = (schema, options) => {
  const { allowAll, allowConfigure, allowMenuItemIds = [] } = options;
  if (allowAll || allowConfigure) {
    return schema;
  }
  const filterSchema = (s) => {
    if (!s) {
      return;
    }
    for (const key in s.properties) {
      if (Object.prototype.hasOwnProperty.call(s.properties, key)) {
        const element = s.properties[key];
        if (element['x-uid'] && !allowMenuItemIds.includes(element['x-uid'])) {
          delete s.properties[key];
        }
        if (element['x-uid']) {
          filterSchema(element);
        }
      }
    }
  };
  filterSchema(schema);
  return schema;
};

const SchemaIdContext = createContext(null);
const useMenuProps = () => {
  const defaultSelectedUid = useContext(SchemaIdContext);
  return {
    selectedUid: defaultSelectedUid,
    defaultSelectedUid,
  };
};
const MenuEditor = (props) => {
  const { setTitle } = useDocumentTitle();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const defaultSelectedUid = match.params.name;
  const { sideMenuRef } = props;
  const ctx = useACLRoleContext();
  const route = useRoute();
  const onSelect = ({ item }) => {
    const schema = item.props.schema;
    setTitle(schema.title);
    history.push(`/admin/${schema['x-uid']}`);
  };
  const { data, loading } = useRequest(
    {
      url: `/uiSchemas:getJsonSchema/${route.uiSchemaUid}`,
    },
    {
      refreshDeps: [route.uiSchemaUid],
      onSuccess(data) {
        const schema = filterByACL(data?.data, ctx);
        if (defaultSelectedUid) {
          if (defaultSelectedUid.includes('/')) {
            return;
          }
          const s = findByUid(schema, defaultSelectedUid);
          if (s) {
            setTitle(s.title);
          } else {
            const s = findMenuItem(schema);
            if (s) {
              history.push(`/admin/${s['x-uid']}`);
              setTitle(s.title);
            } else {
              history.push(`/admin/`);
            }
          }
        } else {
          const s = findMenuItem(schema);
          if (s) {
            history.push(`/admin/${s['x-uid']}`);
            setTitle(s.title);
          } else {
            history.push(`/admin/`);
          }
        }
      },
    },
  );
  const schema = useMemo(() => {
    const s = filterByACL(data?.data, ctx);
    if (s?.['x-component-props']) {
      s['x-component-props']['useProps'] = useMenuProps;
    }
    return s;
  }, [data?.data]);
  if (loading) {
    return <Spin />;
  }
  return (
    <SchemaIdContext.Provider value={defaultSelectedUid}>
      <SchemaComponent memoized scope={{ useMenuProps, onSelect, sideMenuRef, defaultSelectedUid }} schema={schema} />
    </SchemaIdContext.Provider>
  );
};

const InternalAdminLayout = (props: any) => {
  const route = useRoute();
  const history = useHistory();
  const match = useRouteMatch<any>();
  const { setTitle } = useDocumentTitle();
  const sideMenuRef = useRef();

  const result = useSystemSettings();
  const { service } = useCollectionManager();
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
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%', width: 'calc(100vw - 300px)' }}>
          <div style={{ width: 200, display: 'inline-flex', color: '#fff', padding: '0', alignItems: 'center' }}>
            <img
              className={css`
                padding: 0 16px;
                object-fit: contain;
                width: 100%;
                height: 100%;
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
            <MenuEditor sideMenuRef={sideMenuRef} />
          </div>
        </div>
        <div style={{ position: 'absolute', zIndex: 10, top: 0, right: 0 }}>
          <ACLAllowConfigure>
            <RemotePluginManagerToolbar />
          </ACLAllowConfigure>
          <CurrentUser />
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider style={{ display: 'none' }} theme={'light'} ref={sideMenuRef}></Layout.Sider>
        <Layout.Content
          className={css`
            min-height: calc(100vh - 46px);
            padding-bottom: 42px;
            position: relative;
            // padding-bottom: 70px;
            > div {
              position: relative;
              // z-index: 1;
            }
            .ant-layout-footer {
              position: absolute;
              bottom: 0;
              text-align: center;
              width: 100%;
              z-index: 0;
              padding: 0px 50px;
            }
          `}
        >
          {service.contentLoading ? <Spin /> : props.children}
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
    <CurrentAppInfoProvider>
      <CurrentUserProvider>
        <RemoteSchemaTemplateManagerProvider>
          <RemoteCollectionManagerProvider>
            <ACLRolesCheckProvider>
              <InternalAdminLayout {...props} />
            </ACLRolesCheckProvider>
          </RemoteCollectionManagerProvider>
        </RemoteSchemaTemplateManagerProvider>
      </CurrentUserProvider>
    </CurrentAppInfoProvider>
  );
};

export default AdminLayout;
