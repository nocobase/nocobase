import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@nocobase/utils';
import { Cascader as AntdCascader } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../collection-manager';
import { SchemaComponent, useCompile, useFilterOptions } from '../../../schema-component';

export const PickerField = (props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const field = useField<Field>();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const [schema, setSchema] = useState<ISchema>(null);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const { uiSchema } = collectionField;
  const currentUser = useFilterOptions('users');
  const currentRecord = useFilterOptions(collectionField.collectionName);
  console.log('end=====', field.value);

  useEffect(() => {
    const options = [
      {
        name: 'currentUser',
        title: t('Current user'),
        children: [...currentUser],
      },
      {
        name: 'currentRecord',
        title: t('Current record'),
        children: [...currentRecord],
      },
    ];
    setSchema({
      type: 'object',
      'x-decorator': 'FormItem',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            type: {
              type: 'string',
              title: "{{t('Action type')}}",
              'x-component': 'Select',
              default: 'constantValue',
              enum: [
                {
                  label: "{{t('Constant value')}}",
                  value: 'constantValue',
                },
                {
                  label: "{{t('Dynamic value')}}",
                  value: 'dynamicValue',
                },
              ],
            },
            constantValue: {
              type: 'void',
              properties: {
                fieldValue: {
                  ...uiSchema,
                  'x-reactions': {
                    dependencies: [`${fieldSchema.name}.type`],
                    fulfill: {
                      state: {
                        display: '{{$deps[0]==="constantValue"?"visible":"none"}}',
                      },
                    },
                  },
                },
              },
            },
            dynamicValue: {
              type: 'void',
              properties: {
                fieldValue: {
                  type: 'array',
                  'x-component': 'AntdCascader',
                  'x-component-props': {
                    options: options,
                    fieldNames: {
                      label: 'title',
                      value: 'name',
                      children: 'children',
                    },
                  },
                  'x-reactions': {
                    dependencies: [`${fieldSchema.name}.type`],
                    fulfill: {
                      state: {
                        display: '{{$deps[0]==="dynamicValue"?"visible":"none"}}',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }, []);

  if (!uiSchema || !schema) {
    return null;
  }

  return <SchemaComponent memoized schema={schema} components={{ AntdCascader }} basePath={field.address} />;
};
