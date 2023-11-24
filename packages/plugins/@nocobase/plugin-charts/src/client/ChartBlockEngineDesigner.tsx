import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import {
  APIClientProvider,
  FormDialog,
  GeneralSchemaDesigner,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  css,
  i18n,
  useAPIClient,
  useCompile,
  useDesignable,
  useGlobalTheme,
} from '@nocobase/client';
import { error } from '@nocobase/utils/client';
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

export const jsonConfigDesc = (title: string, link: string) => {
  return (
    <span>
      {lang('Json config references: ')}
      <a href={link} target="_blank" rel="noreferrer">
        {lang(title)}
      </a>
    </span>
  );
};

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
  const { chartBlockEngineMetaData } = fieldSchema?.['x-component-props'] || {};
  return (
    <GeneralSchemaDesigner>
      <ChartBlockEngineDesignerInitializer chartBlockEngineMetaData={chartBlockEngineMetaData} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
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
  const compile = useCompile();
  const { chart, query } = chartBlockEngineMetaData;
  const { fields } = useFieldsById(query.id);
  const { theme } = useGlobalTheme();

  const dataSource = fields.map((field) => {
    return {
      label: field.name,
      value: field.name,
    };
  });

  return (
    <SchemaSettingsItem
      title={props.title || 'Edit chart block'}
      onClick={async () => {
        FormDialog(
          {
            okText: compile('{{t("Submit")}}'),
            title: lang('Edit chart block'),
            width: 1200,
            bodyStyle: { background: 'var(--nb-box-bg)', maxHeight: '65vh', overflow: 'auto' },
          },
          function Com(form) {
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
                      gap: 24px;
                    `}
                  >
                    {/*  left*/}
                    <Card
                      bordered={false}
                      title={i18n.t('Chart config')}
                      size={'default'}
                      className={css`
                        flex: 1;
                      `}
                    >
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          scope={{ dataSource, JSON5, jsonConfigDesc }}
                          components={{ Options }}
                          schema={{
                            properties: {
                              // title: {
                              //   title: lang('Chart title'),
                              //   'x-component': 'Input',
                              //   'x-decorator': 'FormItem',
                              // },
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
                      <Card size={'default'} title={lang('Chart preview')}>
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
                        size={'default'}
                        title={lang('Data preview')}
                        className={css`
                          margin-top: 24px;
                          overflow: scroll;
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
          theme,
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
          })
          .catch((err) => {
            error(err);
          });
      }}
    >
      {props.children || props.title || lang('Edit chart block')}
    </SchemaSettingsItem>
  );
};
