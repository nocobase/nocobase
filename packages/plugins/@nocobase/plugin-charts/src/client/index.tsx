import { registerValidateRules } from '@formily/core';
import {
  BlockSchemaComponentPlugin,
  Plugin,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SettingsCenterProvider,
  useAPIClient,
} from '@nocobase/client';
import JSON5 from 'json5';
import React, { useContext } from 'react';
import { ChartBlockEngine } from './ChartBlockEngine';
import { ChartBlockInitializer } from './ChartBlockInitializer';
import { ChartQueryMetadataProvider } from './ChartQueryMetadataProvider';
import './Icons';
import { lang } from './locale';
import { CustomSelect } from './select';
import { QueriesTable } from './settings/QueriesTable';

registerValidateRules({
  json5: (value, rule) => {
    if (!value) {
      return '';
    }
    try {
      const val = JSON5.parse(value);
      if (!isNaN(val)) {
        return {
          type: 'error',
          message: lang('Invalid JSON format'),
        };
      }
      return '';
    } catch (error) {
      console.error(error);
      return {
        type: 'error',
        message: lang('Invalid JSON format'),
      };
    }
  },
});

const ChartsProvider = React.memo((props) => {
  const api = useAPIClient();
  const items = useContext<any>(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;

  if (children) {
    const hasChartItem = children.some((child) => child?.component === 'ChartBlockInitializer');
    if (!hasChartItem) {
      children.push({
        key: 'chart',
        type: 'item',
        icon: 'PieChartOutlined',
        title: '{{t("Chart (Old)",{ns:"charts"})}}',
        component: 'ChartBlockInitializer',
      });
    }
  }
  const validateSQL = (sql) => {
    return new Promise((resolve) => {
      api
        .request({
          url: 'chartsQueries:validate',
          method: 'post',
          data: {
            sql,
          },
        })
        .then(({ data }) => {
          resolve(data?.data?.errorMessage);
        })
        .catch(() => {
          resolve('Invalid SQL');
        });
    });
  };
  return (
    <ChartQueryMetadataProvider>
      <SettingsCenterProvider
        settings={{
          charts: {
            title: '{{t("Charts", {ns:"charts"})}}',
            icon: 'PieChartOutlined',
            tabs: {
              queries: {
                title: '{{t("Queries", {ns:"charts"})}}',
                component: QueriesTable,
              },
            },
          },
        }}
      >
        <SchemaComponentOptions
          scope={{ validateSQL }}
          components={{ CustomSelect, ChartBlockInitializer, ChartBlockEngine }}
        >
          <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
        </SchemaComponentOptions>
      </SettingsCenterProvider>
    </ChartQueryMetadataProvider>
  );
});
ChartsProvider.displayName = 'ChartsProvider';

export class ChartsPlugin extends Plugin {
  async afterAdd() {
    this.app.pm.add(BlockSchemaComponentPlugin);
  }
  async load() {
    this.app.use(ChartsProvider);
  }
}

export default ChartsPlugin;
