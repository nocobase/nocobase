import {
  ACLCollectionFieldProvider,
  BlockItem,
  FormDialog,
  HTMLEncode,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  gridRowColWrap,
  useCollectionManager,
  useDesignable,
  useGlobalTheme,
} from '@nocobase/client';
import React, { useCallback, useContext, useMemo } from 'react';
import { useChartsTranslation } from '../locale';
import { Schema, SchemaOptionsContext, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { useMemoizedFn } from 'ahooks';
import { FormLayout, FormItem } from '@formily/antd-v5';
import { uid } from '@formily/shared';
import { useChartData, useChartFilter } from '../hooks/filter';
import { Alert } from 'antd';
import { getPropsSchemaByComponent } from './utils';
import { Field } from '@formily/core';
import { css, cx } from '@emotion/css';

const FieldComponentProps: React.FC = observer((props) => {
  const form = useForm();
  const schema = getPropsSchemaByComponent(form.values.component);
  return schema ? <SchemaComponent schema={schema} {...props} /> : null;
});

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
          <FormItem className={className} {...props} extra={extra} />
        </BlockItem>
      </ACLCollectionFieldProvider>
    );
  },
  { displayName: 'ChartFilterFormItem' },
);

export const ChartFilterCustomItemInitializer: React.FC<{
  insert?: any;
}> = (props) => {
  const { t: lang } = useChartsTranslation();
  const t = useMemoizedFn(lang);
  const { scope, components } = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { insert } = props;
  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add custom field'),
      () => (
        <SchemaComponentOptions scope={scope} components={{ ...components, FieldComponentProps }}>
          <FormLayout layout={'vertical'}>
            <Alert
              type="info"
              message={t('To filter with custom fields, use "Current filter" variables in the chart configuration.')}
              style={{ marginBottom: 16 }}
            />
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
                  component: {
                    type: 'string',
                    title: t('Field component'),
                    'x-component': 'Select',
                    'x-decorator': 'FormItem',
                    required: true,
                    enum: [
                      { label: t('Input'), value: 'Input' },
                      { label: t('Number'), value: 'InputNumber' },
                      { label: t('Date'), value: 'DatePicker' },
                      { label: t('Date range'), value: 'DatePicker.RangePicker' },
                      { label: t('Time'), value: 'TimePicker' },
                      { label: t('Time range'), value: 'TimePicker.RangePicker' },
                      { label: t('Select'), value: 'Select' },
                      { label: t('Radio group'), value: 'Radio.Group' },
                      { label: t('Checkbox group'), value: 'Checkbox.Group' },
                    ],
                  },
                  props: {
                    type: 'object',
                    title: t('Component properties'),
                    'x-component': 'FieldComponentProps',
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      ),
      theme,
    ).open({
      values: {
        name: `f_${uid()}`,
      },
    });
    const { name, title, component, props } = values;
    insert(
      gridRowColWrap({
        type: 'string',
        title: title,
        name: `custom.${name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-component': component,
        'x-decorator': 'ChartFilterFormItem',
        'x-component-props': props,
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
