import React, { useContext } from "react";
import { FormDialog, FormLayout } from "@formily/antd";
import { FormOutlined } from '@ant-design/icons';
import { SchemaOptionsContext } from "@formily/react";
import { useTranslation } from "react-i18next";

import { useCollectionManager } from "../../collection-manager";
import { SchemaComponent, SchemaComponentOptions } from "../../schema-component";
import { createCalendarBlockSchema } from "../utils";
import { DataBlockInitializer } from "./DataBlockInitializer";

export const CalendarBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Calendar'}
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
        const values = await FormDialog(t('Create calendar block'), () => {
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
          createCalendarBlockSchema({
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
