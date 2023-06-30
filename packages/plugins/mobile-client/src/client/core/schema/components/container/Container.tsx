import { css, cx } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import { RouteSwitch, SchemaComponent, SortableItem, useDesigner } from '@nocobase/client';
import React, { useMemo } from 'react';
import { Navigate, RouteProps, useLocation, useParams } from 'react-router-dom';
import { ContainerDesigner } from './Container.Designer';

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
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const params = useParams<{ name: string }>();
  const location = useLocation();
  const tabBarSchema = fieldSchema?.properties?.['tabBar'];
  const tabBarCurrentFirstKey = tabBarSchema?.properties ? Object.keys(tabBarSchema.properties)[0] : null;
  let redirectToUid = null;
  if (tabBarCurrentFirstKey) {
    redirectToUid = tabBarSchema?.properties[tabBarCurrentFirstKey]?.['x-uid'];
  }

  const tabRoutes = useMemo<RouteProps[]>(() => {
    if (!redirectToUid) {
      return [];
    }
    const locationPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;

    return [
      !params.name
        ? {
          type: 'redirect',
          to: `${locationPath}/tab_${redirectToUid}`,
          from: location.pathname,
          }
        : null,
      {
        type: 'route',
        path: location.pathname,
        component: TabContentComponent,
      },
    ].filter(Boolean) as any[];
  }, [redirectToUid, params.name, location.pathname]);

  return (
    <SortableItem
      eid="nb-mobile-scroll-wrapper"
      className={cx(
        'nb-mobile-container',
        css`
          & > .general-schema-designer > .general-schema-designer-icons {
            right: unset;
            left: 2px;
          }
          background: #f0f2f5;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow-y: scroll;
          position: initial !important;
        `,
      )}
    >
      <Designer></Designer>
      <div
        style={{
          paddingBottom: tabRoutes.length ? '50px' : '0px',
        }}
        className={cx('nb-mobile-container-content')}
      >
        {tabRoutes.length ? (
          <RouteSwitch routes={tabRoutes as any} />
        ) : (
          <SchemaComponent
            filterProperties={(schema) => {
              return schema['x-component'] !== 'MTabBar';
            }}
            schema={fieldSchema}
          />
        )}
      </div>
      <div
        className={cx(
          'nb-mobile-container-tab-bar',
          css`
            & > .general-schema-designer {
              --nb-designer-top: 20px;
            }
            position: absolute;
            background: #ffffff;
            width: 100%;
            bottom: 0;
            left: 0;
            z-index: 1000;
          `,
        )}
      >
        <SchemaComponent
          onlyRenderProperties
          filterProperties={(schema) => {
            return schema['x-component'] === 'MTabBar';
          }}
          schema={fieldSchema}
        ></SchemaComponent>
      </div>
    </SortableItem>
  );
};

export const MContainer = InternalContainer as unknown as typeof InternalContainer & {
  Designer: typeof ContainerDesigner;
};
MContainer.Designer = ContainerDesigner;
MContainer.displayName = 'MContainer';
