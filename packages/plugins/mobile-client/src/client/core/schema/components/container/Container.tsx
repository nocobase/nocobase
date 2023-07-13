import { useFieldSchema } from '@formily/react';
import { css, cx, SchemaComponent, SortableItem, useDesigner } from '@nocobase/client';
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const params = useParams<{ name: string }>();
  const location = useLocation();
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
    <SortableItem
      eid="nb-mobile-scroll-wrapper"
      className={cx(
        'nb-mobile-container',
        css`
          & > .general-schema-designer > .general-schema-designer-icons {
            right: unset;
            left: 2px;
          }
          background: var(--nb-box-bg);
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
          paddingBottom: redirectToUid ? '50px' : '0px',
        }}
        className={cx('nb-mobile-container-content')}
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
