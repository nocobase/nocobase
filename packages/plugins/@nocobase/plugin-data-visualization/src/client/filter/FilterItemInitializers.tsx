/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { FormItem, FormLayout } from '@formily/antd-v5';
import { Field, onFieldValueChange } from '@formily/core';
import { Schema, SchemaOptionsContext, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ACLCollectionFieldProvider,
  BlockItem,
  CollectionFieldProvider,
  CollectionManagerProvider,
  CollectionProvider,
  CompatibleSchemaInitializer,
  DEFAULT_DATA_SOURCE_KEY,
  FormDialog,
  HTMLEncode,
  IsInNocoBaseRecursionFieldContext,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializerItem,
  gridRowColWrap,
  useDataSourceManager,
  useDesignable,
  useGlobalTheme,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Alert, ConfigProvider, Typography } from 'antd';
import React, { memo, useCallback, useContext, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useChartData, useChartFilter, useChartFilterSourceFields, useFieldComponents } from '../hooks/filter';
import { lang, useChartsTranslation } from '../locale';
import { getPropsSchemaByComponent } from './utils';
const { Paragraph, Text } = Typography;

const FieldComponentProps: React.FC = observer(
  (props) => {
    const form = useForm();
    const schema = getPropsSchemaByComponent(form.values.component);
    return schema ? <SchemaComponent schema={schema} {...props} /> : null;
  },
  { displayName: 'FieldComponentProps' },
);

const ErrorFallback = ({ error }) => {
  return (
    <Paragraph copyable>
      <Text type="danger" style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '5px' }}>
        {error.message}
      </Text>
    </Paragraph>
  );
};

export const ChartFilterFormItem = observer(
  (props: any) => {
    const { t } = useChartsTranslation();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const showTitle = schema['x-decorator-props']?.showTitle ?? true;
    const extra = useMemo(() => {
      return typeof field.description === 'string' ? (
        <div
          dangerouslySetInnerHTML={{
            __html: HTMLEncode(field.description).split('\n').join('<br/>'),
          }}
        />
      ) : (
        field.description
      );
    }, [field.description]);
    const className = useMemo(() => {
      return cx(
        css`
          & .ant-space {
            flex-wrap: wrap;
          }
        `,
        {
          [css`
            > .ant-formily-item-label {
              display: none;
            }
          `]: showTitle === false,
        },
      );
    }, [showTitle]);
    const dataSource = schema?.['x-data-source'] || DEFAULT_DATA_SOURCE_KEY;
    const collectionField = schema?.['x-collection-field'] || '';
    const [collection] = collectionField.split('.');
    return (
      <BlockItem className={'nb-form-item'}>
        <CollectionManagerProvider dataSource={dataSource}>
          <CollectionProvider name={collection} allowNull={!collection}>
            <CollectionFieldProvider name={schema.name} allowNull={!schema['x-collection-field']}>
              <ACLCollectionFieldProvider>
                <ErrorBoundary onError={console.log} FallbackComponent={ErrorFallback}>
                  <IsInNocoBaseRecursionFieldContext.Provider value={false}>
                    <FormItem className={className} {...props} extra={extra} />
                  </IsInNocoBaseRecursionFieldContext.Provider>
                </ErrorBoundary>
              </ACLCollectionFieldProvider>
            </CollectionFieldProvider>
          </CollectionProvider>
        </CollectionManagerProvider>
      </BlockItem>
    );
  },
  { displayName: 'ChartFilterFormItem' },
);

export const ChartFilterCustomItemInitializer: React.FC<{
  insert?: any;
}> = memo((props) => {
  const { locale } = useContext(ConfigProvider.ConfigContext);
  const { t: lang } = useChartsTranslation();
  const t = useMemoizedFn(lang);
  const { scope, components } = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { insert } = props;
  const itemConfig = useSchemaInitializerItem();
  const dm = useDataSourceManager();
  const sourceFields = useChartFilterSourceFields();
  const { options: fieldComponents, values: fieldComponentValues } = useFieldComponents();
  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add custom field'),
      () => (
        <SchemaComponentOptions
          scope={{ ...scope, useChartFilterSourceFields }}
          components={{ ...components, FieldComponentProps }}
        >
          <FormLayout layout={'vertical'}>
            <Alert
              type="info"
              message={t('To filter with custom fields, use "Current filter" variables in the chart configuration.')}
              style={{ marginBottom: 16 }}
            />
            <ConfigProvider locale={locale}>
              <SchemaComponent
                schema={{
                  properties: {
                    name: {
                      type: 'string',
                      required: true,
                    },
                    title: {
                      type: 'string',
                      title: t('Field title'),
                      'x-component': 'Input',
                      'x-decorator': 'FormItem',
                      required: true,
                    },
                    source: {
                      type: 'string',
                      title: t('Field source'),
                      'x-decorator': 'FormItem',
                      'x-component': 'Cascader',
                      enum: sourceFields,
                      description: t('Select a source field to use metadata of the field'),
                    },
                    component: {
                      type: 'string',
                      title: t('Field component'),
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                      required: true,
                      enum: fieldComponents,
                    },
                    props: {
                      type: 'object',
                      title: t('Component properties'),
                      'x-component': 'FieldComponentProps',
                    },
                  },
                }}
              />
            </ConfigProvider>
          </FormLayout>
        </SchemaComponentOptions>
      ),
      theme,
    ).open({
      values: {
        name: `f_${uid()}`,
      },
      effects() {
        onFieldValueChange('source', (field) => {
          if (!field.value) {
            return;
          }
          const [dataSource, ...fields] = field.value;
          const ds = dm.getDataSource(dataSource);
          if (!ds) {
            return;
          }
          const cm = ds.collectionManager;
          const name = fields.join('.');
          const props = cm.getCollectionField(name);
          if (!props) {
            return;
          }
          const uiSchema = props.uiSchema || {};
          let fieldComponent: string;
          if (fieldComponentValues.includes(uiSchema['x-component'])) {
            fieldComponent = uiSchema['x-component'];
            const fieldComponentProps = uiSchema['x-component-props'] || {};
            if (uiSchema.enum) {
              fieldComponentProps.options = uiSchema.enum;
            }
            const componentProps = field.query('.props').take() as Field;
            componentProps.setValue(fieldComponentProps);
          } else if (fieldComponentValues.includes(props.interface)) {
            fieldComponent = props.interface;
          }
          if (!fieldComponent) {
            return;
          }
          const component = field.query('.component').take() as Field;
          component.setValue(fieldComponent);
        });
      },
    });
    const { name, title, component, props } = values;
    const fim = dm.collectionFieldInterfaceManager;
    const defaultSchema = fim.getFieldInterface(component)?.default?.uiSchema || {};
    insert(
      gridRowColWrap({
        'x-component': component,
        ...defaultSchema,
        type: 'string',
        title: title,
        name: `custom.${name}`,
        required: false,
        'x-toolbar': 'ChartFilterItemToolbar',
        'x-settings': 'chart:filterForm:item',
        'x-decorator': 'ChartFilterFormItem',
        'x-component-props': {
          ...(defaultSchema['x-component-props'] || {}),
          ...props,
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, insert]);
  return <SchemaInitializerItem {...itemConfig} {...props} onClick={handleClick} />;
});
ChartFilterCustomItemInitializer.displayName = 'ChartFilterCustomItemInitializer';

const filterItemInitializers = {
  name: 'chartFilterForm:configureFields',
  'data-testid': 'configure-fields-button-of-chart-filter-item',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{ t("Configure fields") }}',
  items: [
    {
      type: 'itemGroup',
      name: 'displayFields',
      title: '{{ t("Display fields") }}',
      useChildren: () => {
        const { t } = useChartsTranslation();
        const { chartCollections, showDataSource } = useChartData();
        const { getChartFilterFields } = useChartFilter();
        const dm = useDataSourceManager();
        const fim = dm.collectionFieldInterfaceManager;

        return useMemo(() => {
          const options = Object.entries(chartCollections).map(([dataSource, collections]) => {
            const ds = dm.getDataSource(dataSource);
            return {
              name: ds.key,
              title: Schema.compile(ds.displayName, { t }),
              type: 'subMenu',
              children: collections.map((name) => {
                const cm = ds.collectionManager;
                const collection = cm.getCollection(name);
                const fields = getChartFilterFields({ dataSource, collection, cm, fim });
                return {
                  name: collection.key,
                  title: Schema.compile(collection.title, { t }),
                  type: 'subMenu',
                  children: fields,
                };
              }),
            };
          });
          return showDataSource ? options : options[0]?.children || [];
        }, [chartCollections, showDataSource]);
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'custom',
      type: 'item',
      title: lang('Custom'),
      Component: () => {
        const { insertAdjacent } = useDesignable();
        return <ChartFilterCustomItemInitializer insert={(s: Schema) => insertAdjacent('beforeEnd', s)} />;
      },
    },
  ],
};

/**
 * @deprecated
 * use `chartFilterItemInitializers` instead
 */
export const chartFilterItemInitializers_deprecated = new CompatibleSchemaInitializer({
  ...filterItemInitializers,
  name: 'ChartFilterItemInitializers',
});

export const chartFilterItemInitializers = new CompatibleSchemaInitializer(
  filterItemInitializers,
  chartFilterItemInitializers_deprecated,
);
