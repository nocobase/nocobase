import { css } from '@emotion/css';
import { Layout, Spin } from 'antd';
import React, { createContext, useContext, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  ACLRolesCheckProvider,
  CurrentAppInfoProvider,
  CurrentUser,
  CurrentUserProvider,
  PinnedPluginList,
  RemoteCollectionManagerProvider,
  RemoteSchemaTemplateManagerProvider,
  SchemaComponent,
  findByUid,
  findMenuItem,
  useACLRoleContext,
  useDocumentTitle,
  useRequest,
  useRoute,
  useSystemSettings,
} from '../../../';
import { useCollectionManager } from '../../../collection-manager';

const filterByACL = (schema, options) => {
  const { allowAll, allowMenuItemIds = [] } = options;
  if (allowAll) {
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
  const navigate = useNavigate();
  const params = useParams<any>();
  const defaultSelectedUid = params.name;
  const { sideMenuRef } = props;
  const ctx = useACLRoleContext();
  const route = useRoute();
  const onSelect = ({ item }) => {
    const schema = item.props.schema;
    setTitle(schema.title);
    navigate(`/admin/${schema['x-uid']}`);
  };

  const { data, loading } = useRequest(
    {
      url: `/uiSchemas:getJsonSchema/${route.uiSchemaUid}`,
    },
    {
      refreshDeps: [route.uiSchemaUid],
      onSuccess(data) {
        const schema = filterByACL(data?.data, ctx);
        // url 为 `/admin` 的情况
        if (params['*'] === 'admin') {
          const s = findMenuItem(schema);
          if (s) {
            navigate(`/admin/${s['x-uid']}`);
            setTitle(s.title);
          } else {
            navigate(`/admin/`);
          }
        }

        // url 不为 `/admin/xxx` 的情况，不做处理
        const paramsArr = params['*'].split('/');
        if (paramsArr[0] !== 'admin' || paramsArr[1] !== defaultSelectedUid || paramsArr.length > 2) return;

        // url 为 `admin/xxx` 的情况
        const s = findByUid(schema, defaultSelectedUid);
        if (s) {
          setTitle(s.title);
        } else {
          const s = findMenuItem(schema);
          if (s) {
            navigate(`/admin/${s['x-uid']}`);
            setTitle(s.title);
          } else {
            navigate(`/admin/`);
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

export const InternalAdminLayout = (props: any) => {
  const sideMenuRef = useRef<HTMLDivElement>();
  const result = useSystemSettings();
  const { service } = useCollectionManager();
  const params = useParams<any>();

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

          position: fixed;
          width: 100%;
          height: 46px;
          line-height: 46px;
          padding: 0;
          z-index: 100;
        `}
      >
        <div
          className={css`
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
          `}
        >
          <div
            className={css`
              position: relative;
              z-index: 1;
              flex: 1 1 auto;
              display: flex;
              height: 100%;
            `}
          >
            <div
              className={css`
                width: 200px;
                display: inline-flex;
                flex-shrink: 0;
                color: #fff;
                padding: 0;
                align-items: center;
              `}
            >
              <img
                className={css`
                  padding: 0 16px;
                  object-fit: contain;
                  width: 100%;
                  height: 100%;
                `}
                src={result?.data?.data?.logo?.url}
              />
            </div>
            <div
              className={css`
                flex: 1 1 auto;
                width: 0;
              `}
            >
              <MenuEditor sideMenuRef={sideMenuRef} />
            </div>
          </div>
          <div
            className={css`
              position: relative;
              flex-shrink: 0;
              height: 100%;
              z-index: 10;
            `}
          >
            <PinnedPluginList />
            <CurrentUser />
          </div>
        </div>
      </Layout.Header>
      {params.name && (
        <Layout.Sider
          className={css`
            height: 100%;
            /* position: fixed; */
            position: relative;
            left: 0;
            top: 0;
            background: rgba(0, 0, 0, 0);
            z-index: 100;
            .ant-layout-sider-children {
              top: 46px;
              position: fixed;
              width: 200px;
              height: calc(100vh - 46px);
            }
          `}
          style={{ display: 'none' }}
          theme={'light'}
          ref={sideMenuRef}
        ></Layout.Sider>
      )}
      <Layout.Content
        className={css`
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-y: auto;
          height: 100vh;
          max-height: 100vh;
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
        <header
          className={css`
            flex-shrink: 0;
            height: 46px;
            line-height: 46px;
            background: transparent;
            pointer-events: none;
          `}
        ></header>
        {service.contentLoading ? <Spin /> : <Outlet />}
      </Layout.Content>
    </Layout>
  );
};

export const AdminProvider = (props) => {
  return (
    <CurrentAppInfoProvider>
      <CurrentUserProvider>
        <RemoteSchemaTemplateManagerProvider>
          <RemoteCollectionManagerProvider>
            <ACLRolesCheckProvider>{props.children}</ACLRolesCheckProvider>
          </RemoteCollectionManagerProvider>
        </RemoteSchemaTemplateManagerProvider>
      </CurrentUserProvider>
    </CurrentAppInfoProvider>
  );
};

export const AdminLayout = (props) => {
  return (
    <AdminProvider>
      <InternalAdminLayout {...props} />
    </AdminProvider>
  );
};

export default AdminLayout;
