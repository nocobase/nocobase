/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { useField, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ActionContextProvider,
  IField,
  RecordProvider,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCancelAction,
  useCollectionManager_deprecated,
  useCompile,
  useCurrentAppInfo,
  useDataSourceManager,
  useFieldInterfaceOptions,
  useRecord,
  useRequest,
  useResourceActionContext,
} from '@nocobase/client';
import { Button, Dropdown, MenuProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ForeignKey } from './components';

const getSchema = (schema: IField, record: any, compile) => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.properties) as any;
  if (properties?.foreignKey) {
    properties.foreignKey['x-component'] = ForeignKey;
  }

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema?.default?.uiSchema);
    properties.defaultValue.required = false;
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
    properties['defaultValue']['x-reactions'] = {
      dependencies: [
        'uiSchema.x-component-props.gmt',
        'uiSchema.x-component-props.showTime',
        'uiSchema.x-component-props.dateFormat',
        'uiSchema.x-component-props.timeFormat',
      ],
      fulfill: {
        state: {
          componentProps: {
            gmt: '{{$deps[0]}}',
            showTime: '{{$deps[1]}}',
            dateFormat: '{{$deps[2]}}',
            timeFormat: '{{$deps[3]}}',
          },
        },
      },
    };
  }
  const initialValue: any = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  // initialValue.uiSchema.title = schema.title;
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: `${compile(record.title || record.name)} - ${compile('{{ t("Add field") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          description: {
            type: 'string',
            title: '{{t("Description")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ useCreateCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const useCollectionFieldFormValues = () => {
  const form = useForm();
  return {
    getValues() {
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
        /* empty */
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      return values;
    },
  };
};

const useCreateCollectionField = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const field = useField();
  const api = useAPIClient();
  const record = useRecord();
  const { name: dataSourceKey } = useParams();
  const dm = useDataSourceManager();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
        /* empty */
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      try {
        await api.request({
          url: `dataSourcesCollections/${dataSourceKey}.${record.name}/fields:create`,
          method: 'post',
          data: values,
        });
        ctx.setVisible(false);
        dm.getDataSource(dataSourceKey).reload();
        await form.reset();
        field.data.loading = false;
        refresh();
      } catch (error) {
        field.data.loading = false;
      }
    },
  };
};

export const AddCollectionField = (props) => {
  const record = useRecord();
  return <AddFieldAction item={record} {...props} />;
};

const AddFieldAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align, database } = props;
  const { getInterface, getTemplate, collections } = useCollectionManager_deprecated();
  const [visible, setVisible] = useState(false);
  const [targetScope, setTargetScope] = useState();
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useTranslation();
  const {
    data: { database: currentDatabase },
  } = useCurrentAppInfo() || {
    data: { database: {} as any },
  };
  const isDialect = (dialect: string) => currentDatabase?.dialect === dialect;

  const currentCollections = useMemo(() => {
    return collections.map((v) => {
      return {
        label: compile(v.title),
        value: v.name,
      };
    });
  }, []);
  const fieldOptions = useFieldInterfaceOptions();
  const getFieldOptions = useCallback(() => {
    const { availableFieldInterfaces } = getTemplate(record.template) || {};
    const { exclude, include } = availableFieldInterfaces || {};
    const optionArr = [];
    fieldOptions.forEach((v) => {
      if (v.key === 'relation') {
        let children = [];
        if (include?.length) {
          include.forEach((k) => {
            const field = v?.children?.find((h) => [k, k.interface].includes(h.value));
            field &&
              children.push({
                ...field,
                targetScope: k?.targetScope,
              });
          });
        } else if (exclude?.length) {
          children = v?.children?.filter((v) => {
            return !exclude.includes(v.value);
          });
        } else {
          children = v?.children;
        }
        children?.length &&
          optionArr.push({
            ...v,
            children,
          });
      }
    });
    return optionArr;
  }, [getTemplate, record]);
  const items = useMemo<MenuProps['items']>(() => {
    return getFieldOptions()
      .map((option) => {
        if (option?.children?.length === 0) {
          return null;
        }
        if (record.template === 'view') {
          return {
            type: 'group' as const,
            label: compile(option.label),
            title: compile(option.label),
            key: option.label,
            children: option.children
              .filter((child) => ['m2o'].includes(child.name))
              .map((child) => {
                return {
                  label: compile(child.title),
                  title: compile(child.title),
                  key: child.name,
                  dataTargetScope: child.targetScope,
                };
              }),
          };
        }
        return {
          type: 'group' as const,
          label: compile(option.label),
          title: compile(option.label),
          key: option.label,
          children: option?.children
            .filter((child) => !['o2o', 'subTable', 'linkTo'].includes(child.name))
            .map((child) => {
              return {
                label: compile(child.title),
                title: compile(child.title),
                key: child.name,
                dataTargetScope: child.targetScope,
              };
            }),
        };
      })
      .filter((v) => v?.children?.length);
  }, [getFieldOptions]);
  const menu = useMemo<MenuProps>(() => {
    return {
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      onClick: (e) => {
        //@ts-ignore
        const targetScope = e.item.props['data-targetScope'];
        targetScope && setTargetScope(targetScope);
        const schema = getSchema(getInterface(e.key), record, compile);
        if (schema) {
          setSchema(schema);
          setVisible(true);
        }
      },
      items,
    };
  }, [getInterface, items, record]);
  return (
    record.template !== 'sql' && (
      <RecordProvider record={record}>
        <ActionContextProvider value={{ visible, setVisible }}>
          <Dropdown getPopupContainer={getContainer} trigger={trigger} align={align} menu={menu}>
            {children || (
              <Button icon={<PlusOutlined />} type={'primary'}>
                {t('Add field')}
              </Button>
            )}
          </Dropdown>
          <SchemaComponent
            schema={schema}
            components={{ ArrayTable }}
            scope={{
              getContainer,
              useCancelAction,
              createOnly: true,
              isOverride: false,
              override: false,
              useCreateCollectionField,
              record,
              showReverseFieldConfig: false,
              targetScope,
              collections: currentCollections,
              isDialect,
              disabledJSONB: false,
              createMainOnly: true,
              ...scope,
            }}
          />
        </ActionContextProvider>
      </RecordProvider>
    )
  );
};
