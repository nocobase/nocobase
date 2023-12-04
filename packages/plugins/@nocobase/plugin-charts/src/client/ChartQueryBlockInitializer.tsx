import { TableOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import {
  FormDialog,
  SchemaInitializerItem,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useGlobalTheme,
  useSchemaInitializer,
} from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import React, { useCallback, useContext, useMemo } from 'react';
import { useChartQueryMetadataContext } from './ChartQueryMetadataProvider';
import { lang } from './locale';
import { getQueryTypeSchema } from './settings/queryTypes';

export interface ChartQueryMetadata {
  id: number;
  title: string;
  type: string;
  fields: { name: string }[];
}

export const ChartQueryBlockInitializer = (props) => {
  const { templateWrap, onCreateBlockSchema, componentType, createBlockSchema, ...others } = props;
  const { setVisible } = useSchemaInitializer();
  const apiClient = useAPIClient();
  const ctx = useChartQueryMetadataContext();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const onAddQuery = useCallback(
    (info) => {
      FormDialog(
        {
          sql: lang('Add SQL query'),
          json: lang('Add JSON query'),
        }[info.key],
        () => {
          return (
            <div>
              <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                <FormLayout layout={'vertical'}>
                  <SchemaComponent
                    schema={{
                      type: 'object',
                      properties: {
                        title: {
                          title: lang('Title'),
                          required: true,
                          'x-component': 'Input',
                          'x-decorator': 'FormItem',
                        },
                        options: getQueryTypeSchema(info.key),
                      },
                    }}
                  />
                </FormLayout>
              </SchemaComponentOptions>
            </div>
          );
        },
        theme,
      )
        .open({
          initialValues: {
            type: info.key,
          },
        })
        .then(async (values) => {
          try {
            if (apiClient.resource('chartsQueries')?.create) {
              const { data } = await apiClient.resource('chartsQueries').create({ values });
              const items = (await ctx.refresh()) as any;
              const item = items.find((item) => item.id === data?.data?.id);
              onCreateBlockSchema({ item });
            }
            setVisible(false);
          } catch (err) {
            error(err);
          }
        })
        .catch((err) => {
          error(err);
        });
    },
    [apiClient, ctx, onCreateBlockSchema, options.components, options.scope, setVisible],
  );

  const items = useMemo(() => {
    const defaultItems: any = [
      {
        type: 'itemGroup',
        title: lang('Select query data'),
        children: [],
      },
    ];
    const chartQueryMetadata = ctx.data;
    if (chartQueryMetadata && Array.isArray(chartQueryMetadata)) {
      const item1 =
        chartQueryMetadata.length > 0
          ? {
              type: 'itemGroup',
              title: '{{t("Select chart query", {ns: "charts"})}}',
              children: chartQueryMetadata,
            }
          : null;
      const item2 =
        chartQueryMetadata.length > 0
          ? {
              type: 'divider',
            }
          : null;

      return [
        item1,
        item2,
        {
          type: 'subMenu',
          title: lang('Add chart query'),
          // component: AddChartQuery,
          children: [
            {
              key: 'sql',
              type: 'item',
              title: 'SQL',
              onClick: onAddQuery,
            },
            {
              key: 'json',
              type: 'item',
              title: 'JSON',
              onClick: onAddQuery,
            },
          ],
        },
      ].filter(Boolean);
    }

    return defaultItems;
  }, [ctx.data, onAddQuery]);

  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        onCreateBlockSchema({ item });
        setVisible(false);
      }}
      items={items}
    />
  );
};
