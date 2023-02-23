import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
} from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { templates } from './templates';
import { DataSetBlockInitializer } from './DataSetBlockInitializer';
import { css } from '@emotion/css';
import JSON5 from 'json5';
import DataSetPreviewTable from './DataSetPreviewTable';
import { parseDataSetString } from './utils';
import { ChartBlockEngine } from './ChartBlockEngine';

export const Options = observer((props) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  const [chartType, setChartType] = useState(form.values.chartType);
  useEffect(() => {
    // form.clearFormGraph('options.*');
    setChartType(form?.values?.chartType);
    if (chartType !== form?.values?.chartType)
      form.clearFormGraph('options.*');
    if (form.values.chartType) {
      const template = templates.get(form.values.chartType);
      setSchema(new Schema(template.configurableProperties || {}));
    }
  }, [form.values.chartType]);
  return <RecursionField name={form.values.chartType || 'default'} schema={s} />;
});

export const ChartBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <DataSetBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const dataSource = Object.keys(JSON5.parse(item.data_set_value)[0]).map(key => {
          return {
            label: key,
            value: key,
          };
        });
        let values = await FormDialog({ title: t('Create chart block'), width: 1200 }, () => {
          const [dataSet, setDataSet] = useState(parseDataSetString(item?.data_set_value));
          const form = useForm();
          const [previewMetaData, setPreviewMetaData] = useState(null);
          useEffect(() => {
            const renderComponent = templates.get(form.values.chartType)?.renderComponent;
            const result = {
              dataSetMetaData: {
                dataSetMetaData: item,
                chartConfig: form.values,
              },
            };
            setPreviewMetaData(result);
          }, [form.values.chartType]);
          console.log(previewMetaData);
          return (
            <APIClientProvider apiClient={api}>
              <SchemaComponentOptions
                scope={options.scope}
                components={{ ...options.components }}
              >
                <section className={
                  css`
                    display: flex;
                    gap: 16px;
                  `
                }>
                  {/*  left*/}
                  <div className={
                    css`
                      flex: 1
                    `
                  }>
                    <FormProvider form={form}>
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          scope={{ dataSource, JSON5, setPreviewMetaData }}
                          components={{ Options }}
                          schema={{
                            properties: {
                              chartType: {
                                title: t('Chart type'),
                                required: true,
                                'x-component': 'CustomSelect',
                                'x-decorator': 'FormItem',
                                enum: [...templates.values()].map((template) => {
                                  return {
                                    label: template.title,
                                    value: template.type,
                                    group: template.group,
                                  };
                                }),
                              },
                              options: {
                                type: 'void',
                                'x-component': 'Options',
                              },
                            },
                          }}
                        />
                      </FormLayout>
                    </FormProvider>
                  </div>
                  {/*  right*/}
                  <div className={
                    css`
                      max-width: 600px;
                    `
                  }>
                    {/*DataSet Preview*/}
                    <h4>DataSet Preview:</h4>
                    <DataSetPreviewTable dataSet={dataSet} />
                    {
                      (previewMetaData?.dataSetMetaData?.chartConfig?.chartType !== undefined && previewMetaData?.dataSetMetaData?.chartConfig?.chartType !== 'DataSetPreviewTable')
                      &&
                      <div className={
                        css`
                          display: flex;
                          gap: 10px;
                        `
                      }>
                        <h4>
                          Chart Preview:
                        </h4>
                      </div>
                    }
                    {/*  Chart Preview*/}
                    {
                      previewMetaData
                      &&
                      <>
                        <SchemaComponent
                          schema={{
                            properties: {
                              chartPreview: {
                                type: 'void',
                                'x-decorator': 'CardItem',
                                'x-component': 'ChartBlockEngine',
                                'title': `${previewMetaData?.dataSetMetaData?.title ?? ''}`,
                                'x-component-props': {
                                  previewMetaData: previewMetaData,
                                },
                              },
                            },
                          }}
                        />
                      </>
                    }
                  </div>
                </section>
              </SchemaComponentOptions>
            </APIClientProvider>
          );
        }).open({
          initialValues: {},
        });
        if (values) {
          values = {
            dataSetMetaData: {
              dataSetMetaData: item,
              chartConfig: values,
            },
          };
          insert({
            type: 'void',
            'x-designer': 'ChartBlockEngine.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngine',
            'title': `${values?.dataSetMetaData?.title ?? ''}`,
            'x-component-props': {
              previewMetaData: values,
            },
          });
        }
      }}
    />
  );
};
