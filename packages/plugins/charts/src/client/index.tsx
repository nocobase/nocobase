import { SchemaComponentOptions, SchemaInitializerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartBlockEngine } from './ChartBlockEngine';
import { ChartBlockInitializer } from './ChartBlockInitializer';
import { ChartQueryMetadataProvider } from './ChartQueryMetadataProvider';
import './Icons';
import { CustomSelect } from './select';
import { QueriesTable } from './settings/QueriesTable';

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;
  children.push({
    key: 'chart',
    type: 'item',
    icon: 'PieChartOutlined',
    title: '{{t("Chart",{ns:"charts"})}}',
    component: 'ChartBlockInitializer',
  });
  return (
    <ChartQueryMetadataProvider>
      <SettingsCenterProvider
        settings={{
          charts: {
            title: '{{t("Chart",{ns:"charts"})}}',
            icon: 'PieChartOutlined',
            tabs: {
              queries: {
                title: '{{t("Queries",{ns:"charts"})}}',
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
