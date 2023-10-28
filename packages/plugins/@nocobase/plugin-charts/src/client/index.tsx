import { registerValidateRules } from '@formily/core';
import {
  BlockSchemaComponentPlugin,
  Plugin,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useAPIClient,
} from '@nocobase/client';
import JSON5 from 'json5';
import React from 'react';
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
          {props.children}
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
    // Chart (Old) 老的不需要了
    // const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    // blockInitializers?.add('data-blocks.chart-old', {
    //   icon: 'PieChartOutlined',
    //   title: '{{t("Chart (Old)",{ns:"charts"})}}',
    //   Component: 'ChartBlockInitializer',
    // });
    this.app.use(ChartsProvider);
  }
}

export default ChartsPlugin;
