import React, { useContext } from 'react';
import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useCompile,
  Select,
  FormDialog,
  SchemaComponentOptions,
  SchemaComponent,
  useGlobalTheme,
  useAPIClient,
  useRequest,
} from '@nocobase/client';
import { useForm, SchemaOptionsContext, useField } from '@formily/react';
import { FormLayout } from '@formily/antd-v5';

import { NAMESPACE } from '../locale';
import { uid } from '@formily/shared';

export const CreateAndSelectSort = (props) => {
  const { sortFields, collectionFields, groupField, collectionName, dataSource, ...others } = props;
  const field: any = useField();
  const compile = useCompile();
  const api = useAPIClient();
  const { t } = useTranslation();
  const { theme } = useGlobalTheme();
  const options = useContext(SchemaOptionsContext);
  const integerfields = collectionFields?.filter((v) => {
    return v.interface === 'integer';
  });
  console.log(props);
  const ScopekeyDescription = ({ scopeKey }) => {
    const field = scopeKey && collectionFields.find((v) => v.name === scopeKey);
    const result = scopeKey ? compile(field['uiSchema']?.['title']) : t('Global sorting', { ns: NAMESPACE });
    return (
      <span style={{ color: 'GrayText' }}>
        ({t('Grouping sorting based on', { ns: NAMESPACE }) + `「 ${result} 」`})
      </span>
    );
  };

  //仅支持主数据源
  const handleCreateSortField = async () => {
    const values = await FormDialog(
      t('Create sort field'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    'uiSchema.title': {
                      type: 'string',
                      title: '{{t("Field display name")}}',
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    name: {
                      type: 'string',
                      title: '{{t("Field name")}}',
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-validator': 'uid',
                      description:
                        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
                    },
                    scopeKey: {
                      type: 'string',
                      title: '{{t("Group sorting")}}',
                      default: groupField.value,
                      'x-disabled': true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [groupField],
                    },
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: { name: `f_${uid()}` },
    });
    const { data } = await api.resource('collections.fields', collectionName).create({
      values: {
        type: 'sort',
        interface: 'sort',
        ...values,
      },
    });
    field.dataSource = sortFields.concat([
      { ...data.data, value: data.data.name, label: compile(data.data['uiSchema']?.['title']) },
    ]);
    field.value = data.data.name;
  };
  //第三方数据源
  const handleUpdateSortField = async () => {
    const values = await FormDialog(
      t('Create sort field'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    field: {
                      type: 'string',
                      title: `{{t("Convert the following integer fields to sorting fields",{ns:${NAMESPACE}})}}`,
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: integerfields.map((v) => {
                        return {
                          value: v.name,
                          label: compile(v['uiSchema']?.['title'] || v.name),
                        };
                      }),
                    },
                    scopeKey: {
                      type: 'string',
                      title: '{{t("Group sorting")}}',
                      default: groupField.value,
                      'x-disabled': true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [groupField],
                    },
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { data } = await api.resource('collections.fields', collectionName).update({
      filterByTk: values.field.value,
      values: {
        type: 'sort',
        interface: 'sort',
        ...values,
      },
    });
    field.dataSource = sortFields.concat([
      { ...data.data, value: data.data.name, label: compile(data.data['uiSchema']?.['title']) },
    ]);
    field.value = data.data.name;
  };
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        options={sortFields}
        {...others}
        disabled={!groupField}
        optionRender={({ label, data }) => {
          return (
            <Space>
              <span>{label}</span>
              <ScopekeyDescription scopeKey={data.scopeKey} />
            </Space>
          );
        }}
      />
      <Button disabled={!groupField} onClick={dataSource === 'main' ? handleCreateSortField : handleUpdateSortField}>
        {t('Add new')}
      </Button>
    </Space.Compact>
  );
};
