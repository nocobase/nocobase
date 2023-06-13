import { css, cx } from '@emotion/css';
import { RecursionField, useFieldSchema } from '@formily/react';
import { ActionBarProvider, SortableItem, TabsContextProvider, useDesigner } from '@nocobase/client';
import { TabsProps } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { createSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { countGridCol } from '../../helpers';
import { PageDesigner } from './Page.Designer';

const globalActionCSS = css`
  #nb-position-container > & {
    height: 49px;
    border-top: 1px solid #f0f2f5;
    margin-bottom: 0px !important;
    padding: 0 var(--nb-spacing);
    align-items: center;
    overflow-x: auto;
    background: #ffffff;
    z-index: 100;
  }
`;

const InternalPage: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tabsSchema = fieldSchema.properties?.['tabs'];
  // Only support globalActions in page
  const onlyInPage = fieldSchema.root === fieldSchema.parent;
  let hasGlobalActions = false;
  if (!tabsSchema) {
    hasGlobalActions = countGridCol(fieldSchema.properties['grid'], 2) === 1;
  } else if (query.has('tab') && tabsSchema.properties?.[query.get('tab')]) {
    hasGlobalActions = countGridCol(tabsSchema.properties[query.get('tab')]?.properties?.['grid'], 2) === 1;
  } else if (tabsSchema.properties) {
    const schema = Object.values(tabsSchema.properties).sort((t1, t2) => t1['x-index'] - t2['x-index'])[0];
    if (schema) {
      navigate(
        {
          pathname: location.pathname,
          search: createSearchParams([['tab', schema.name.toString()]]).toString(),
        },
        { replace: true },
      );
    }
  }

  const onTabsChange = useCallback<TabsProps['onChange']>(
    (key) => {
      navigate(
        {
          pathname: location.pathname,
          search: createSearchParams([['tab', key]]).toString(),
        },
        { replace: true },
      );
    },
    [navigate, location],
  );

  const GlobalActionProvider = useMemo(() => {
    if (hasGlobalActions) {
      return ActionBarProvider;
    }
    return (props) => <>{props.children}</>;
  }, [hasGlobalActions]);

  return (
    <GlobalActionProvider
      container={hasGlobalActions && onlyInPage ? document.getElementById('nb-position-container') : null}
      forceProps={{
        layout: 'one-column',
        className: globalActionCSS,
      }}
    >
      <SortableItem
        eid="nb-mobile-scroll-wrapper"
        className={cx(
          'nb-mobile-page',
          css`
            background: #f0f2f5;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: auto;
            padding-bottom: var(--nb-spacing);
          `,
        )}
      >
        <Designer {...fieldSchema?.['x-designer-props']}></Designer>
        <div
          style={{
            paddingBottom: tabsSchema ? null : 'var(--nb-spacing)',
          }}
          className={cx(
            'nb-mobile-page-header',
            css`
              & > .ant-tabs > .ant-tabs-nav {
                background: #fff;
                padding: 0 var(--nb-spacing);
              }
              display: flex;
              flex-direction: column;
            `,
          )}
        >
          <RecursionField
            schema={fieldSchema}
            filterProperties={(s) => {
              return 'MHeader' === s['x-component'];
            }}
          ></RecursionField>
          <TabsContextProvider deep={false} activeKey={query.get('tab')} onChange={onTabsChange}>
            <RecursionField
              schema={fieldSchema}
              filterProperties={(s) => {
                return 'Tabs' === s['x-component'];
              }}
            ></RecursionField>
          </TabsContextProvider>
        </div>

        {!tabsSchema && (
          <RecursionField
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] !== 'MHeader';
            }}
          ></RecursionField>
        )}
      </SortableItem>
    </GlobalActionProvider>
  );
};

export const MPage = InternalPage as unknown as typeof InternalPage & {
  Designer: typeof PageDesigner;
};
MPage.Designer = PageDesigner;
MPage.displayName = 'MPage';
