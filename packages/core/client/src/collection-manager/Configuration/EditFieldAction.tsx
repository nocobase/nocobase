import { ArrayTable } from '@formily/antd-v5';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import set from 'lodash/set';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction, useUpdateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import useDialect from '../hooks/useDialect';
import { IField } from '../interfaces/types';
import * as components from './components';

const getSchema = (schema: IField, record: any, compile, getContainer): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  if (properties?.name) {
    properties.name['x-disabled'] = true;
  }

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema) || {};
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
                  data: cloneDeep(omit(schema.default, ['uiSchema.rawTitle'])),
                }),
              options,
            );
          },
        },
        title: `${compile(record.__parent?.title)} - ${compile('{{ t("Edit field") }}')}`,
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
                  useAction: '{{ useUpdateCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

const useUpdateCollectionField = () => {
  const form = useForm();
  const { run } = useUpdateAction();
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
        /* empty */
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      await resource.update({ filterByTk, values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
    },
  };
};

export const EditCollectionField = (props) => {
  const record = useRecord();
  return <EditFieldAction item={record} {...props} />;
};

export const EditFieldAction = (props) => {
  const { scope, getContainer, item: record, children, ...otherProps } = props;
  const { getInterface, collections } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  const [data, setData] = useState<any>({});
  const { isDialect } = useDialect();

  const currentCollections = useMemo(() => {
    return collections.map((v) => {
      return {
        label: compile(v.title),
        value: v.name,
      };
    });
  }, []);

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          {...otherProps}
          onClick={async () => {
            const { data } = await api.resource('collections.fields', record.collectionName).get({
              filterByTk: record.name,
              appends: ['reverseField'],
            });
            setData(data?.data);
            const interfaceConf = getInterface(record.interface);
            const defaultValues: any = cloneDeep(data?.data) || {};
            if (!defaultValues?.reverseField) {
              defaultValues.autoCreateReverseField = false;
              defaultValues.reverseField = interfaceConf?.default?.reverseField;
              set(defaultValues.reverseField, 'name', `f_${uid()}`);
              set(defaultValues.reverseField, 'uiSchema.title', record.__parent.title);
            }
            const schema = getSchema(
              {
                ...interfaceConf,
                default: defaultValues,
              },
              record,
              compile,
              getContainer,
            );
            setSchema(schema);
            setVisible(true);
          }}
        >
          {children || t('Edit')}
        </a>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useUpdateCollectionField,
            useCancelAction,
            showReverseFieldConfig: !data?.reverseField,
            collections: currentCollections,
            isDialect,
            disabledJSONB: true,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
