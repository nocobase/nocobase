import { SchemaComponentOptions, SchemaInitializerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext, useEffect } from 'react';
import { ChartBlockEngine } from './ChartBlockEngine';
import { ChartBlockInitializer } from './ChartBlockInitializer';
import { ChartQueryMetadataProvider } from './ChartQueryMetadataProvider';
import { CustomSelect } from './select';
import { QueriesTable } from './settings/QueriesTable';
import { ChartSvgs } from './ChartSvgs';

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;
  useEffect(()=>{
    const svgElement = new DOMParser().parseFromString(ChartSvgs,'text/html').querySelector('svg');
    document.body.appendChild(svgElement);
  },[])
  children.push({
    key: 'chart',
    type: 'item',
    title: '{{t("Chart")}}',
    component: 'ChartBlockInitializer',
  });
  return (
    <ChartQueryMetadataProvider>
      <SettingsCenterProvider
        settings={{
          charts: {
            title: '{{t("Charts")}}',
            icon: 'PieChartOutlined',
            tabs: {
              queries: {
                title: '{{t("Queries")}}',
                component: () => <QueriesTable />,
              },
            },
          },
        }}
      >
        <SchemaComponentOptions components={{ CustomSelect, ChartBlockInitializer, ChartBlockEngine }}>
          <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
        </SchemaComponentOptions>
      </SettingsCenterProvider>
    </ChartQueryMetadataProvider>
  );
});
