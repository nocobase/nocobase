import React, { useMemo } from 'react';
import { css, cx } from '@emotion/css';
import { ContainerDesigner } from './Container.Designer';
import { RouteSwitch, SchemaComponent, SortableItem, useDesigner } from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { Redirect, RouteProps, useParams, useRouteMatch } from 'react-router-dom';

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
    return <Redirect to="../" />;
  }
  return <SchemaComponent schema={gridSchema} />;
};

const InternalContainer: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const params = useParams<{ name: string }>();
  const match = useRouteMatch();
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
    return [
      !params.name
        ? {
            type: 'redirect',
            to: `${match.url}/tab_${redirectToUid}`,
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
  }, [redirectToUid, params.name, match.url, match.path]);

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
