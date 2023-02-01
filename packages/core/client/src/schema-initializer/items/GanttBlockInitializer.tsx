import React, { useContext } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { FormOutlined } from '@ant-design/icons';
import { SchemaOptionsContext } from '@formily/react';
import { useTranslation } from 'react-i18next';

import { useCollectionManager } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { createGanttBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const GanttBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Gantt'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name);
        const stringFields = collectionFields
          ?.filter((field) => field.type === 'string')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const dateFields = collectionFields
          ?.filter((field) => field.type === 'date')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
          const numberFields = collectionFields
          ?.filter((field) => field.type === 'float')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const values = await FormDialog(t('Create gantt block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: t('Title field'),
                        enum: stringFields,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: t('Start date field'),
                        enum: dateFields,
                        required: true,
                        default: 'createdAt',
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: t('End date field'),
                        enum: dateFields,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                       progress: {
                        title: t('Progress field'),
                        enum: numberFields,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      range: {
                        title: t('Time range'),
                        enum: [
                          { label: '{{t("Hour")}}', value: 'hour', color: 'orange' },
                          { label: '{{t("Quarter of day")}}', value: 'quarterDay', color: 'default' },
                          { label: '{{t("Half of day")}}', value: 'halfDay', color: 'blue' },
                          { label: '{{t("Day")}}', value: 'day', color: 'yellow' },
                          { label: '{{t("Week")}}', value: 'week', color: 'pule' },
                          { label: '{{t("Month")}}', value: 'month', color: 'green' },
                          { label: '{{t("Year")}}', value: 'year', color: 'green' },
                          { label: '{{t("QuarterYear")}}', value: 'quarterYear', color: 'red' },
                        ],
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        insert(
          createGanttBlockSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
    />
  );
};
