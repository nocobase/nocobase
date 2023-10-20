import {
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  gridRowColWrap,
  useCollectionManager,
  useDesignable,
  useGlobalTheme,
} from '@nocobase/client';
import React, { useCallback, useContext } from 'react';
import { useChartsTranslation } from '../locale';
import { Schema, SchemaOptionsContext } from '@formily/react';
import { useMemoizedFn } from 'ahooks';
import { FormLayout } from '@formily/antd-v5';
import { uid } from '@formily/shared';
import { useChartData, useChartFilter, useCustomFieldInterface } from '../hooks/filter';

export const ChartFilterCustomItemInitializer: React.FC<{
  insert?: any;
}> = (props) => {
  const { t: lang } = useChartsTranslation();
  const t = useMemoizedFn(lang);
  const { scope, components } = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { insert } = props;
  const { getSchemaByInterface } = useCustomFieldInterface();
  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add custom field'),
      () => (
        <SchemaComponentOptions scope={scope} components={{ ...components }}>
          <FormLayout layout={'vertical'}>
            <SchemaComponent
              schema={{
                properties: {
                  name: {
                    type: 'string',
                    title: t('Field name'),
                    'x-component': 'Input',
                    'x-decorator': 'FormItem',
                    'x-disabled': true,
                    required: true,
                  },
                  title: {
                    type: 'string',
                    title: t('Field title'),
                    'x-component': 'Input',
                    'x-decorator': 'FormItem',
                    required: true,
                  },
                  interface: {
                    type: 'string',
                    title: t('Field interface'),
                    'x-component': 'Select',
                    'x-decorator': 'FormItem',
                    required: true,
                    enum: [
                      { label: t('Single line text'), value: 'input' },
                      { label: t('Number'), value: 'number' },
                      { label: t('Date & Time'), value: 'datetime' },
                      { label: t('Single select'), value: 'select' },
                      { label: t('Multiple select'), value: 'multipleSelect' },
                    ],
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      ),
      theme,
    ).open({
      initialValues: {
        name: `f_${uid()}`,
      },
    });
    const { name, title, interface: fieldInterface } = values;
    const uiSchema = getSchemaByInterface(fieldInterface);
    insert(
      gridRowColWrap({
        type: 'string',
        title: title,
        name: `custom.${name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        ...uiSchema,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return <SchemaInitializer.Item {...props} onClick={handleClick} />;
};

export const ChartFilterItemInitializers: React.FC = (props) => {
  const { t } = useChartsTranslation();
  const { getCollection } = useCollectionManager();
  const { getChartCollections } = useChartData();
  const { getChartFilterFields } = useChartFilter();
  const collections = getChartCollections();
  const { insertAdjacent } = useDesignable();
  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-chart-filter-item"
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: collections.map((name: any) => {
            const collection = getCollection(name);
            const fields = getChartFilterFields(collection);
            return {
              key: collection.key,
              type: 'subMenu',
              title: collection.title,
              children: fields,
            };
          }),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Custom'),
          component: () => <ChartFilterCustomItemInitializer insert={(s: Schema) => insertAdjacent('beforeEnd', s)} />,
        },
      ]}
      title={t('Configure fields')}
    />
  );
};
