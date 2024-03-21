import { registerValidateRules } from '@formily/core';
import { BlockSchemaComponentPlugin, Plugin, SchemaComponentOptions, useAPIClient } from '@nocobase/client';
import JSON5 from 'json5';
import React from 'react';
import { ChartBlockEngine } from './ChartBlockEngine';
import { ChartBlockInitializer } from './ChartBlockInitializer';
import { ChartQueryMetadataProvider } from './ChartQueryMetadataProvider';
import './Icons';
import { NAMESPACE, lang } from './locale';
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
      <SchemaComponentOptions
        scope={{ validateSQL }}
        components={{ CustomSelect, ChartBlockInitializer, ChartBlockEngine }}
      >
        {props.children}
      </SchemaComponentOptions>
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
    // const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    // blockInitializers?.add('data-blocks.chart-old', {
    //   icon: 'PieChartOutlined',
    //   title: '{{t("Chart (Old)",{ns:"charts"})}}',
    //   Component: 'ChartBlockInitializer',
    // });
    this.app.use(ChartsProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Charts", { ns: "${NAMESPACE}" })}}`,
      icon: 'PieChartOutlined',
      Component: QueriesTable,
      aclSnippet: 'pm.charts.queries',
    });
  }
}

export default ChartsPlugin;
