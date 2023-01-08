import {FormOutlined} from '@ant-design/icons';
import {FormDialog, FormLayout, FormDrawer} from '@formily/antd';
import {SchemaOptionsContext} from '@formily/react';
import React, {useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {SchemaComponent, SchemaComponentOptions, useAPIClient, useCollectionManager} from "@nocobase/client";
import {DataBlockInitializer} from '@nocobase/client'
import {ChartConfigurationOptions, ChartConfigurationSchemaTemplate} from "./ChartSchemaTemplates";
import {templates} from "./templates";

export const ChartBlockInitializer = (props) => {
  const {insert} = props;
  const {t} = useTranslation();
  const {getCollectionFields, getCollection} = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined/>}
      onCreateBlockSchema={async ({item}) => {
        const collectionFields = getCollectionFields(item.name);
        let values = await FormDialog(t('Create chart block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{...options.components,ChartConfigurationOptions}}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      chartType: {
                        title: t('Chart type'),
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                        enum: templates.map(template => {
                          return {
                            label: template.type,
                            value: template.type,
                          }
                        })
                      },
                      //   template
                      ...ChartConfigurationSchemaTemplate({collectionFields}),
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        if (values) {
          values = {
            collectionName: item.name,
            ...values
          }
          console.log(values)
          insert({
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngine',
            'x-component-props': {
              formData: values,
            },
          })
        }
      }}
    />
  );
};
