import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { ActionBarProvider, SortableItem, TabsContextProvider, css, cx, useDesigner } from '@nocobase/client';
import { TabsProps } from 'antd';
import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { countGridCol, findSchema } from '../../helpers';
import { PageDesigner } from './Page.Designer';
import useStyles from './style';

const InternalPage: React.FC = (props) => {
  const { styles } = useStyles();
  const Designer = useDesigner();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsSchema = fieldSchema.properties?.['tabs'];
  const isHeaderEnabled = field.componentProps.headerEnabled !== false;
  const isTabsEnabled = field.componentProps.tabsEnabled !== false && tabsSchema;

  let pageSchema = findSchema(fieldSchema, 'MPage');
  if (!isTabsEnabled && !pageSchema && tabsSchema) {
    const schemaArr = Object.values(tabsSchema.properties || {}).sort((k1, k2) => {
      return k1['x-index'] - k2['x-index'];
    });
    if (schemaArr.length !== 0) {
      pageSchema = schemaArr[0];
    }
  }

  // Only support globalActions in page
  const onlyInPage = fieldSchema.root === fieldSchema.parent;
  let hasGlobalActions = false;
  if (!tabsSchema && fieldSchema.properties) {
    hasGlobalActions = countGridCol(fieldSchema.properties['grid'], 2) === 1;
  } else if (searchParams.has('tab') && tabsSchema?.properties?.[searchParams.get('tab')]) {
    hasGlobalActions = countGridCol(tabsSchema.properties[searchParams.get('tab')]?.properties?.['grid'], 2) === 1;
  } else if (tabsSchema?.properties) {
    const schema = Object.values(tabsSchema.properties).sort((t1, t2) => t1['x-index'] - t2['x-index'])[0];
    if (schema) {
      setTimeout(() => {
        setSearchParams([['tab', schema.name.toString()]], {
          replace: true,
        });
      });
    }
  }

  const onTabsChange = useCallback<TabsProps['onChange']>(
    (key) => {
      setSearchParams([['tab', key]], {
        replace: true,
      });
    },
    [setSearchParams],
  );

  const GlobalActionProvider = useCallback(
    (props) => {
      return (
        <TabsContextProvider>
          {hasGlobalActions ? (
            <ActionBarProvider
              container={
                (typeof props.active !== 'undefined' ? props.active : true) && onlyInPage
                  ? document.getElementById('nb-position-container')
                  : null
              }
              forceProps={{
                layout: 'one-column',
                className: styles.globalActionCSS,
              }}
            >
              {props.children}
            </ActionBarProvider>
          ) : (
            props.children
          )}
        </TabsContextProvider>
      );
    },
    [hasGlobalActions, onlyInPage, styles.globalActionCSS],
  );

  return (
    <SortableItem eid="nb-mobile-scroll-wrapper" className={cx('nb-mobile-page', styles.mobilePage)}>
      <Designer {...fieldSchema?.['x-designer-props']}></Designer>
      <div
        style={{
          paddingBottom: tabsSchema ? null : 'var(--nb-spacing)',
        }}
        className={cx('nb-mobile-page-header', styles.mobilePageHeader, {
          [css`
            & > .ant-nb-grid {
              margin-top: 14px;
            }
          `]: (tabsSchema && !isTabsEnabled) || !tabsSchema,
        })}
      >
        {isHeaderEnabled && (
          <RecursionField
            schema={fieldSchema}
            filterProperties={(s) => {
              return 'MHeader' === s['x-component'];
            }}
          ></RecursionField>
        )}
        <TabsContextProvider
          PaneRoot={GlobalActionProvider}
          activeKey={searchParams.get('tab')}
          onChange={onTabsChange}
        >
          <RecursionField
            schema={isTabsEnabled ? fieldSchema : pageSchema}
            filterProperties={(s) => {
              return 'Tabs' === s['x-component'] || 'Grid' === s['x-component'] || 'Grid.Row' === s['x-component'];
            }}
          ></RecursionField>
        </TabsContextProvider>
      </div>
      <GlobalActionProvider>
        {!tabsSchema && (
          <RecursionField
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] !== 'MHeader';
            }}
          ></RecursionField>
        )}
      </GlobalActionProvider>
    </SortableItem>
  );
};

export const MPage = InternalPage as unknown as typeof InternalPage & {
  Designer: typeof PageDesigner;
};
MPage.Designer = PageDesigner;
MPage.displayName = 'MPage';
