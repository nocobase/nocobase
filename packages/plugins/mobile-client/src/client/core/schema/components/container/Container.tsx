import React, { useEffect, useMemo } from 'react';
import { css, cx } from '@emotion/css';
import { ContainerDesigner } from './Container.Designer';
import { RouteSwitch, SchemaComponent, SortableItem, useCompile, useDesigner } from '@nocobase/client';
import { Schema, useFieldSchema } from '@formily/react';
import { RouteProps, useParams, useRouteMatch } from 'react-router-dom';

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
  if (!name) return;
  const gridSchema = findGrid(fieldSchema.properties['tabBar'], name.replace('tab_', ''));
  return <SchemaComponent schema={gridSchema} />;
};

const InternalContainer: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const params = useParams<{ name: string }>();
  const match = useRouteMatch();

  const tabRoutes = useMemo<RouteProps[]>(() => {
    const tabBarSchema = fieldSchema?.properties?.['tabBar'];
    if (tabBarSchema) {
      return [
        !params.name
          ? {
              type: 'redirect',
              to: `${match.url}/tab_${tabBarSchema.properties[Object.keys(tabBarSchema.properties)[0]]['x-uid']}`,
              from: match.url,
              exact: true,
            }
          : null,
        {
          type: 'route',
          path: match.path,
          component: TabContentComponent,
        },
      ].filter(Boolean) as any[];
    }
    return [];
  }, [Object.keys(fieldSchema.properties), match.url, params.name]);

  return (
    <SortableItem
      eid="nb-mobile-scroll-wrapper"
      className={cx(
        'nb-mobile-container',
        css`
          padding: var(--nb-spacing) 0;
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
          paddingBottom: tabRoutes.length ? '49px' : '0px',
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
