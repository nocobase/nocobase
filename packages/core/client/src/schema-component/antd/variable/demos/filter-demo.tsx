import {
  AntdSchemaComponentProvider,
  Filter,
  Plugin,
  SchemaComponent,
  useCollectionFilterOptionsV2,
  Variable,
  VariableEvaluateProvider,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { now } from 'lodash';
import React, { useCallback } from 'react';
const scope = [
  { label: 'v1', value: 'v1' },
  { label: 'Date', value: '$nDate', children: [{ label: 'Now', value: 'now' }] },
];

const Demo = () => {
  const useFilterProps = () => {
    const dynamicComponent = useCallback((props) => {
      const data = {
        // Date only formats
        today_dateOnly: dayjs().format('YYYY-MM-DD'),
        yesterday_dateOnly: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        tomorrow_dateOnly: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        now_ts_s: new Date().getTime(),
      };
      const dateScopesByType = {
        dateOnly: [
          { label: 'Today', value: 'today_dateOnly' },
          { label: 'Yesterday', value: 'yesterday_dateOnly' },
          { label: 'Tomorrow', value: 'tomorrow_dateOnly' },
        ],
        datetime: [
          { label: 'Now', value: 'now_withTZ' },
          { label: 'Today', value: 'today_withTZ' },
          { label: 'Yesterday', value: 'yesterday_withTZ' },
          { label: 'Tomorrow', value: 'tomorrow_withTZ' },
        ],
        unixTimestamp: [{ label: 'Now', value: 'now_ts_s' }],
        datetimeNoTz: [
          { label: 'Now', value: 'now_withoutTZ' },
          { label: 'Today', value: 'today_withoutTZ' },
          { label: 'Yesterday', value: 'yesterday_withoutTZ' },
          { label: 'Tomorrow', value: 'tomorrow_withoutTZ' },
        ],
      };
      const { collectionField } = props;
      const scope = dateScopesByType[collectionField?.type] || [];
      return (
        <VariableEvaluateProvider data={data} context={{}}>
          <Variable.Input scope={scope} {...props} />
        </VariableEvaluateProvider>
      );
    }, []);
    return { dynamicComponent, collectionName: 'date_collection' };
  };
  const { getFields } = useCollectionFilterOptionsV2('date_collection');
  const schema = {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      collection: 'date_collection', // users 数据表
      dataSource: 'main', // 多数据源标识，可以不写，默认为 main
    },
    properties: {
      filter: {
        enum: getFields(),
        name: 'filter',
        type: 'object',
        title: 'Filter',
        'x-component': 'Filter',
        'x-component-props': {
          collectionName: 'date_collection',
        },

        'x-use-component-props': 'useFilterProps',
      },
    },
  };
  return (
    <AntdSchemaComponentProvider>
      <SchemaComponent schema={schema} scope={{ useFilterProps }} components={{ Filter }} />
    </AntdSchemaComponentProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
