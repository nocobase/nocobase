import { css } from '@emotion/css';
import { Layout, Spin } from 'antd';
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
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
import { useMutationObserver } from 'ahooks';

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
  const sideMenuRef = useRef<HTMLDivElement>();
  const [sideMenuWidth, setSideMenuWidth] = useState(0);

  useMutationObserver(
    (value) => {
      const width = (value[0].target as HTMLDivElement).offsetWidth;
      setSideMenuWidth(width);
    },
    sideMenuRef,
    {
      childList: true,
      attributes: true,
    },
  );

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
          `}
        >
          <div
            style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%', width: 'calc(100vw - 300px)' }}
          >
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
          <div style={{ position: 'absolute', height: '100%', zIndex: 10, top: 0, right: 0 }}>
            <ACLAllowConfigure>
              <RemotePluginManagerToolbar />
            </ACLAllowConfigure>
            <CurrentUser />
          </div>
        </div>
      </Layout.Header>
      <div
        style={
          {
            '--side-menu-width': `${sideMenuWidth}px`,
          } as Record<string, string>
        }
        className={css`
          width: var(--side-menu-width);
          overflow: hidden;
          flex: 0 0 var(--side-menu-width);
          max-width: var(--side-menu-width);
          min-width: var(--side-menu-width);
          pointer-events: none;
          transition: background-color 0.3s ease 0s, min-width 0.3s ease 0s,
            max-width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) 0s;
        `}
      ></div>
      <Layout.Sider
        className={css`
          height: 100%;
          position: fixed;
          padding-top: 46px;
          left: 0;
          top: 0;
          background: rgba(0, 0, 0, 0);
          z-index: 100;
        `}
        style={{ display: 'none' }}
        theme={'light'}
        ref={sideMenuRef}
      ></Layout.Sider>
      <Layout.Content
        className={css`
          padding-bottom: 0;
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
            height: 46px;
            line-height: 46px;
            background: transparent;
            pointer-events: none;
          `}
        ></header>
        {service.contentLoading ? <Spin /> : props.children}
      </Layout.Content>
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
