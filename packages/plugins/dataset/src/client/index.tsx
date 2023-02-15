import { TableOutlined } from '@ant-design/icons';
import {
  FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerContext, useAPIClient, useCollection,
} from '@nocobase/client';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataSetDesigner } from './DataSetDesigner';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext, useForm } from '@formily/react';
import { parseDataSetString, validateArray } from './utils';
import { css } from '@emotion/css';
import { Button } from 'antd';
import DataSetPreviewTable from './DataSetPreviewTable';
import JSON5 from 'json5';
import { uid } from '@formily/shared';

export const DataSetBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const apiClient = useAPIClient();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={async () => {
        const values = await FormDialog(t('Create DataSet Block(🚧Beta Version)'), () => {
          const form = useForm();
          const [dataSet, setDataSet] = useState<null | []>(null);
          const handleDataSetPreview = useCallback((e) => {
            form.validate();
            console.log(form.values);
            const mockData = form?.values?.mockData;
            if (mockData) {
              const mockDataArray = parseDataSetString(mockData);
              setDataSet(mockDataArray);
            }
          }, [form.values]);
          const DataSetPreview = useCallback(() => {
            return <section>
              <header
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 10px;
                `}
              >
                <h4>DataSet Preview:</h4>
                <Button onClick={handleDataSetPreview} size='small' style={{ marginTop: '-5px' }}>Refresh</Button>
              </header>
              {/* Table */}
              <DataSetPreviewTable dataSet={dataSet} />
            </section>;
          }, [dataSet]);
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components, DataSetPreviewTable }}>
              <FormLayout layout={'vertical'}>
                <FormProvider form={form}>
                  <SchemaComponent
                    schema={{
                      properties: {
                        dataSetName: {
                          title: t('DataSet Name'),
                          required: true,
                          'x-component': 'Input',
                          'x-component-props': { size: 'middle' },
                          'x-decorator': 'FormItem',
                          'x-pattern': 'editable',
                        },
                        dataSetType: {
                          title: t('DataSet Type'),
                          required: true,
                          'x-component': 'Select',
                          'x-component-props': {
                            // objectValue: true,
                            // fieldNames: { label: 'label', value: 'value' },
                          },
                          'x-decorator': 'FormItem',
                          enum: [
                            { label: 'Mock', value: 'mock' },
                          ],
                        },
                        mockData: {
                          title: t('Mock Data'),
                          required: true,
                          'x-rules': 'array',
                          'x-component': 'Input.TextArea',
                          'x-validator': validateArray,
                          'x-decorator': 'FormItem',
                          'x-reactions': {
                            dependencies: ['dataSetType'],
                            fulfill: {
                              state: {
                                visible: '{{$deps[0] === "mock"}}',
                              },
                            },
                          },
                        },
                      },
                    }}
                  />
                </FormProvider>
                {/*DataSet Preview*/}
                <DataSetPreview />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        let dataSet = [];
        if (values?.mockData) {
          dataSet = parseDataSetString(values.mockData);
          const data_set_id = uid();
          const { dataSetType, mockData, dataSetName } = values;
          const data = {
            data_set_id,
            data_set_type: dataSetType,
            data_set_value: mockData,
            data_set_name: dataSetName,
          };
          apiClient.request({
            method: 'post',
            url: `datasets:create`,
            data,
          }).then((res) => {
            insert({
              type: 'void',
              'x-component': 'CardItem',
              'x-designer': 'DataSetDesigner',
              properties: {
                hello: {
                  type: 'void',
                  'x-component': 'DataSetPreviewTable',
                  'x-component-props': {
                    dataSet,
                  },
                },
              },
            });
          });
        }
      }}
    />
  );
};

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;
  children.push({
    key: 'DataSet',
    type: 'item',
    title: '{{t("Create DataSet")}}',
    component: 'DataSetBlockInitializer',
  });
  return (
    <SchemaComponentOptions components={{ DataSetDesigner, DataSetPreviewTable, DataSetBlockInitializer }}>
      <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
    </SchemaComponentOptions>
  );
});
