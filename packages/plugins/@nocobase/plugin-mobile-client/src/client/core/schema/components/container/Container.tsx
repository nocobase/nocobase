import { useField, useFieldSchema } from '@formily/react';
import { cx, SchemaComponent, SortableItem, useDesigner, useToken } from '@nocobase/client';
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ContainerDesigner } from './Container.Designer';
import useStyles from './style';

const findGrid = (schema, uid) => {
  return schema.reduceProperties((final, next) => {
    if (final) return final;
    if (next['x-component'] === 'MTabBar') {
      return findGrid(next, uid);
    }
    if (next['x-component'] === 'MTabBar.Item' && uid === next['x-uid']) {
      return next;
    }
  });
};

const TabContentComponent = () => {
  const { name } = useParams<{ name: string }>();
  const fieldSchema = useFieldSchema();
  if (!name) return <></>;
  const gridSchema = findGrid(fieldSchema.properties['tabBar'], name.replace('tab_', ''));
  if (!gridSchema) {
    return <Navigate replace to="../" />;
  }
  return <SchemaComponent schema={gridSchema} />;
};

const InternalContainer: React.FC = (props) => {
  const { styles } = useStyles();
  const { token } = useToken();
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const navigate = useNavigate();
  const params = useParams<{ name: string }>();
  const location = useLocation();
  const field = useField();
  const isTabBarEnabled = field.componentProps.tabBarEnabled !== false;
  const tabBarSchema = fieldSchema?.properties?.['tabBar'];
  const tabBarCurrentFirstKey = tabBarSchema?.properties ? Object.keys(tabBarSchema.properties)[0] : null;
  let redirectToUid = null;
  if (tabBarCurrentFirstKey) {
    redirectToUid = tabBarSchema?.properties[tabBarCurrentFirstKey]?.['x-uid'];
  }
  useEffect(() => {
    if (redirectToUid && !params.name) {
      const locationPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
      navigate(`${locationPath}/tab_${redirectToUid}`, { replace: true });
    }
  }, [location.pathname, navigate, params.name, redirectToUid]);

  return (
    <SortableItem eid="nb-mobile-scroll-wrapper" className={cx('nb-mobile-container', styles.mobileContainer)}>
      <Designer></Designer>
      <div
        style={{
          paddingBottom: redirectToUid ? token.paddingLG * 2 : 0,
        }}
        className="nb-mobile-container-content"
      >
        {redirectToUid ? (
          <TabContentComponent />
        ) : (
          <SchemaComponent
            filterProperties={(schema) => {
              return schema['x-component'] !== 'MTabBar';
            }}
            schema={fieldSchema}
          />
        )}
      </div>
      {isTabBarEnabled && (
        <div className={cx('nb-mobile-container-tab-bar', styles.tabBar)}>
          <SchemaComponent
            onlyRenderProperties
            filterProperties={(schema) => {
              return schema['x-component'] === 'MTabBar';
            }}
            schema={fieldSchema}
          ></SchemaComponent>
        </div>
      )}
    </SortableItem>
  );
};

export const MContainer = InternalContainer as unknown as typeof InternalContainer & {
  Designer: typeof ContainerDesigner;
};
MContainer.Designer = ContainerDesigner;
MContainer.displayName = 'MContainer';
