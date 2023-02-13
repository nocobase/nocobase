import { TableOutlined } from '@ant-design/icons';
import {
  FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerContext,
} from '@nocobase/client';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { DataSetDesigner } from './DataSetDesigner';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext, useForm } from '@formily/react';
import Array from '@nocobase/database/src/operators/array';
import { validateArray } from './utils';
import { css } from '@emotion/css';
import { Button } from 'antd';
export const DataSetBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const form = useForm();
  const options = useContext(SchemaOptionsContext);
  const handleDataSetPreview = useCallback((e)=>{
    console.log(form.values);
    form.validate()
  },[form.values])
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={async () => {
        const values = await FormDialog(t('Create DataSet Block(🚧Beta Version)'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <FormProvider form={form}>
                  <SchemaComponent
                    schema={{
                      properties: {
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
                          required:true,
                          'x-rules':'array',
                          'x-component': 'Input.TextArea',
                          'x-validator':validateArray,
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
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap:10px;
                  `}
                >
                  <h4>DataSet Preview:</h4>
                  <Button onClick={handleDataSetPreview} size="small" style={{marginTop:"-5px"}}>Refresh</Button>
                </div>
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        console.log(values,"values===============");
        // insert({
        //   type: 'void',
        //   'x-component': 'CardItem',
        //   'x-designer': 'DataSetDesigner',
        //   properties: {
        //     hello: {
        //       type: 'void',
        //       'x-component': 'div',
        //       'x-content': 'Hello World',
        //     },
        //   },
        // });
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
    <SchemaComponentOptions components={{ DataSetDesigner , DataSetBlockInitializer }}>
      <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
    </SchemaComponentOptions>
  );
});
