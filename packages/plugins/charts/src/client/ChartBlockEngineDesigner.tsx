import { css } from '@emotion/css';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import {
  APIClientProvider,
  GeneralSchemaDesigner,
  i18n,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { Card } from 'antd';
import JSON5 from 'json5';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBlockEngineMetaData } from './ChartBlockEngine';
import { Options } from './ChartBlockInitializer';
import DataSetPreviewTable from './DataSetPreviewTable';
import { useFieldsById } from './hooks';
import { lang } from './locale';
import { templates } from './templates';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format",{ ns: "charts" })}}',
};

export const ChartBlockEngineDesigner = () => {
  const fieldSchema = useFieldSchema();
  const { chartBlockEngineMetaData } = fieldSchema?.['x-component-props'];
  return (
    <GeneralSchemaDesigner>
      <ChartBlockEngineDesignerInitializer chartBlockEngineMetaData={chartBlockEngineMetaData} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const ChartBlockEngineDesignerInitializer = (props) => {
  const { chartBlockEngineMetaData }: { chartBlockEngineMetaData: ChartBlockEngineMetaData } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const field = useField();
  const compiler = useCompile();
  const { chart, query } = chartBlockEngineMetaData;
  const { fields } = useFieldsById(query.id);
  const dataSource = fields.map((field) => {
    return {
      label: field.name,
      value: field.name,
    };
  });
  return (
    <SchemaSettings.Item
      onClick={async () => {
        FormDialog(
          {
            title: lang('Edit chart block'),
            width: 1200,
            bodyStyle: { background: '#f0f2f5', maxHeight: '65vh', overflow: 'auto' },
          },
          (form) => {
            const [chartBlockEngineMetaData, setChartBlockEngineMetaData] = useState<ChartBlockEngineMetaData>(null);
            useEffect(() => {
              const chartBlockEngineMetaData = {
                query: {
                  id: query?.id,
                },
                chart: form.values, //TODO
              };
              setChartBlockEngineMetaData(chartBlockEngineMetaData);
            }, [form.values.type]);
            return (
              <APIClientProvider apiClient={api}>
                <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                  <section
                    className={css`
                      display: flex;
                      gap: 16px;
                    `}
                  >
                    {/*  left*/}
                    <Card
                      bordered={false}
                      title={i18n.t('Chart config')}
                      size={'small'}
                      className={css`
                        flex: 1;
                      `}
                    >
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          scope={{ dataSource, JSON5 }}
                          components={{ Options }}
                          schema={{
                            properties: {
                              title: {
                                title: lang('Chart title'),
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                              },
                              type: {
                                title: t('Chart type'),
                                required: true,
                                'x-component': 'CustomSelect',
                                'x-decorator': 'FormItem',
                                enum: [...templates.values()].map((template) => {
                                  return {
                                    title: template.title,
                                    key: template.type,
                                    description: template.description,
                                    group: template.group,
                                    iconId: template.iconId,
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
                    </Card>
                    {/*  right*/}
                    <div
                      className={css`
                        flex: 1;
                        min-width: 600px;
                      `}
                    >
                      <Card size='small' title={lang('Chart preview')}>
                        {/*  Chart Preview*/}
                        {chartBlockEngineMetaData && (
                          <>
                            <SchemaComponent
                              schema={{
                                properties: {
                                  chartPreview: {
                                    type: 'void',
                                    'x-decorator': 'CardItem',
                                    'x-component': 'ChartBlockEngine',
                                    'x-component-props': {
                                      chartBlockEngineMetaData: chartBlockEngineMetaData,
                                    },
                                  },
                                },
                              }}
                            />
                          </>
                        )}
                      </Card>
                      <Card
                        size='small'
                        title={lang('Data preview')}
                        className={css`
                          margin-top: 8px;
                        `}
                      >
                        {/*Data preview*/}
                        {chartBlockEngineMetaData?.query?.id && (
                          <DataSetPreviewTable queryId={chartBlockEngineMetaData?.query?.id} fields={fields} />
                        )}
                      </Card>
                    </div>
                  </section>
                </SchemaComponentOptions>
              </APIClientProvider>
            );
          },
        )
          .open({
            initialValues: { ...chart }, //reset before chartBlockMetaData
          })
          .then((values) => {
            //patch updates
            values = {
              query,
              chart: values,
            };
            field.title = values.chart.title;
            fieldSchema['title'] = values.chart.title;
            field.componentProps.chartBlockEngineMetaData = values;
            fieldSchema['x-component-props'].chartBlockEngineMetaData = values;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          });
      }}
    >
      {props.children || props.title || 'Edit chart block'}
    </SchemaSettings.Item>
  );
};
