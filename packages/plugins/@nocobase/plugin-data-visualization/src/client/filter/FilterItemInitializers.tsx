import { css, cx } from '@emotion/css';
import { FormItem, FormLayout } from '@formily/antd-v5';
import { Field, onFieldValueChange } from '@formily/core';
import { Schema, SchemaOptionsContext, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ACLCollectionFieldProvider,
  BlockItem,
  FormDialog,
  HTMLEncode,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerItem,
  gridRowColWrap,
  useCollectionManager,
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

const FieldComponentProps: React.FC = observer((props) => {
  const form = useForm();
  const schema = getPropsSchemaByComponent(form.values.component);
  return schema ? <SchemaComponent schema={schema} {...props} /> : null;
});

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

    return (
      <ACLCollectionFieldProvider>
        <BlockItem className={'nb-form-item'}>
          <ErrorBoundary onError={(err) => console.log(err)} FallbackComponent={ErrorFallback}>
            <FormItem className={className} {...props} extra={extra} />
          </ErrorBoundary>
        </BlockItem>
      </ACLCollectionFieldProvider>
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
  const { getCollectionJoinField, getInterface } = useCollectionManager();
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
          const name = field.value?.join('.');
          const props = getCollectionJoinField(name);
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
    const defaultSchema = getInterface(component)?.default?.uiSchema || {};
    insert(
      gridRowColWrap({
        'x-component': component,
        ...defaultSchema,
        type: 'string',
        title: title,
        name: `custom.${name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-decorator': 'ChartFilterFormItem',
        'x-component-props': {
          ...(defaultSchema['x-component-props'] || {}),
          ...props,
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return <SchemaInitializerItem {...itemConfig} {...props} onClick={handleClick} />;
});

export const chartFilterItemInitializers: SchemaInitializer = new SchemaInitializer({
  name: 'ChartFilterItemInitializers',
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
        const { getCollection } = useCollectionManager();
        const { getChartCollections } = useChartData();
        const { getChartFilterFields } = useChartFilter();
        const collections = getChartCollections();

        return useMemo(() => {
          return collections.map((name: any) => {
            const collection = getCollection(name);
            const fields = getChartFilterFields(collection);
            return {
              name: collection.key,
              type: 'subMenu',
              title: collection.title,
              children: fields,
            };
          });
        }, [collections]);
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
});
