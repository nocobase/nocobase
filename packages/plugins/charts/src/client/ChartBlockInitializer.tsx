import {FormOutlined} from '@ant-design/icons';
import {FormDialog, FormLayout, FormDrawer} from '@formily/antd';
import {SchemaOptionsContext} from '@formily/react';
import React, {useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {SchemaComponent, SchemaComponentOptions, useAPIClient, useCollectionManager} from "@nocobase/client";
import {DataBlockInitializer} from '@nocobase/client'
import PieSchemaTemplate from "./PieSchemaTemplate";
import { getChartBlockSchema, getChartData} from "./ChartUtils";

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
        const values = await FormDialog(t('Create chart block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{...options.components}}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      chartType: {
                        title: t('Chart type'),
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                        enum: [
                          {label: 'Pie', value: 'Pie'},
                          {label: 'Column', value: 'Column'},
                          {label: 'Statistic', value: 'Statistic'}
                        ],
                      },
                      //   template
                      ...PieSchemaTemplate({collectionFields})
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
          //解析values发送请求获取render数据
          const data = await getChartData(api,values)
          console.log(data,"==================")
          //再生成schema insert
          const chartBlockSchema = getChartBlockSchema(values, data);
          insert(chartBlockSchema)
        }
      }}
    />
  );
};
