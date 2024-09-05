/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useMemo, useState } from 'react';

import { ArrayTable } from '@formily/antd-v5';
import { Field, createForm } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { cloneDeep, pick, set } from 'lodash';

import {
  ActionContextProvider,
  CollectionProvider_deprecated,
  CompatibleSchemaInitializer,
  FormBlockContext,
  RecordProvider,
  SchemaComponent,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  SchemaInitializerItems,
  gridRowColWrap,
  useCollectionManager_deprecated,
  useCollectionRecordData,
  useCollection_deprecated,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { JOB_STATUS } from '@nocobase/plugin-workflow/client';
import { merge, uid } from '@nocobase/utils/client';

import { NAMESPACE, useLang } from '../../../locale';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

function CustomFormBlockProvider(props) {
  const [fields, setCollectionFields] = useState(props.collection?.fields ?? []);
  const userJob = useCollectionRecordData();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const [formKey] = Object.keys(fieldSchema.toJSON().properties ?? {});
  const values = userJob?.result?.[formKey];

  const form = useMemo(
    () =>
      createForm({
        initialValues: values,
      }),
    [values],
  );

  return !userJob?.status || values ? (
    <CollectionProvider_deprecated
      collection={{
        ...props.collection,
        fields,
      }}
    >
      <RecordProvider record={values} parent={null}>
        <FormBlockContext.Provider
          value={{
            form,
            field,
            setCollectionFields,
          }}
        >
          {props.children}
        </FormBlockContext.Provider>
      </RecordProvider>
    </CollectionProvider_deprecated>
  ) : null;
}

function CustomFormBlockInitializer() {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'CustomFormBlockProvider',
          'x-decorator-props': {
            collection: {
              name: uid(),
              fields: [],
            },
          },
          'x-component': 'CardItem',
          'x-component-props': {
            title: '{{t("Form")}}',
          },
          'x-designer': 'SimpleDesigner',
          'x-designer-props': {
            type: 'customForm',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'FormV2',
              'x-use-component-props': 'useFormBlockProps',
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'workflowManual:customForm:configureFields',
                },
                actions: {
                  type: 'void',
                  'x-decorator': 'ActionBarProvider',
                  'x-component': 'ActionBar',
                  'x-component-props': {
                    layout: 'one-column',
                    style: {
                      marginTop: '1.5em',
                      flexWrap: 'wrap',
                    },
                  },
                  'x-initializer': 'workflowManual:form:configureActions',
                  properties: {
                    resolve: {
                      type: 'void',
                      title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'ManualActionStatusProvider',
                      'x-decorator-props': {
                        value: JOB_STATUS.RESOLVED,
                      },
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: '{{ useSubmit }}',
                      },
                      'x-designer': 'ManualActionDesigner',
                    },
                  },
                },
              },
            },
          },
        });
      }}
    />
  );
}

const GroupLabels = {
  basic: '{{t("Basic")}}',
  choices: '{{t("Choices")}}',
  media: '{{t("Media")}}',
  datetime: '{{t("Date & Time")}}',
  relation: '{{t("Relation")}}',
  advanced: '{{t("Advanced type")}}',
  systemInfo: '{{t("System info")}}',
  others: '{{t("Others")}}',
};

function getOptions(interfaces) {
  const fields = {};

  Object.keys(interfaces).forEach((type) => {
    const schema = interfaces[type];
    const { group = 'others' } = schema;
    fields[group] = fields[group] || {};
    set(fields, [group, type], schema);
  });

  return Object.keys(GroupLabels)
    .filter((groupName) => ['basic', 'choices', 'datetime', 'media'].includes(groupName))
    .map((groupName) => ({
      title: GroupLabels[groupName],
      children: Object.keys(fields[groupName] || {})
        .map((type) => {
          const field = fields[groupName][type];
          return {
            value: type,
            title: field.title,
            name: type,
            ...fields[groupName][type],
          };
        })
        .sort((a, b) => a.order - b.order),
    }));
}

function useCommonInterfaceInitializers(): SchemaInitializerItemType[] {
  const { interfaces } = useCollectionManager_deprecated();
  const options = getOptions(interfaces);

  return options.map((group) => ({
    name: group.title,
    type: 'itemGroup',
    title: group.title,
    children: group.children.map((item) => ({
      name: item.name,
      type: 'item',
      title: item.title,
      Component: CustomFormFieldInitializer,
      fieldInterface: item.name,
    })),
  }));
}

const AddCustomFormFieldButtonContext = React.createContext<any>({});

function useAction() {
  const { values, query, reset } = useForm();
  const messages = [useLang('Field name existed in form')];
  const { collection, interfaceOptions, setCollectionFields, insert, setCallback, setInterface } = useContext(
    AddCustomFormFieldButtonContext,
  );
  return {
    async run() {
      const { default: options } = interfaceOptions;
      const defaultName = uid();
      options.name = values.name ?? defaultName;
      options.uiSchema.title = values.uiSchema?.title ?? defaultName;
      options.interface = interfaceOptions.name;
      const existed = collection.fields?.find((item) => item.name === options.name);
      if (existed) {
        const field = query('name').take() as Field;
        field.setFeedback({
          type: 'error',
          // code: 'FormulaError',
          messages,
        });
        return;
      }
      const newField = merge(options, values) as any;
      setCollectionFields([...collection.fields, newField]);

      insert({
        name: options.name,
        type: options.uiSchema.type,
        'x-decorator': 'FormItem',
        'x-component': 'CollectionField',
        'x-component-props': {
          field: newField,
        },
        'x-collection-field': `${collection.name}.${options.name}`,
        // 'x-designer': 'FormItem.Designer',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'fieldSettings:FormItem',
      });
      reset();
      setCallback(null);
      setInterface(null);
    },
  };
}

const CustomItemsComponent = (props) => {
  const [interfaceOptions, setInterface] = useState<any>(null);
  const [insert, setCallback] = useState<any>();
  const items = useCommonInterfaceInitializers();
  const collection = useCollection_deprecated();
  const { setCollectionFields } = useContext(FormBlockContext);
  const form = useMemo(() => createForm(), []);
  return (
    <AddCustomFormFieldButtonContext.Provider
      value={{
        collection,
        insert,
        interfaceOptions,
        onAddField(item) {
          const fieldInterface: Record<string, any> = pick(item, [
            'name',
            'group',
            'title',
            'default',
            'validateSchema',
          ]);
          const {
            properties: { unique, type, layout, autoIncrement, ...properties },
          } = item;
          fieldInterface.properties = properties;
          const result = cloneDeep(fieldInterface);
          delete result.properties.name['x-disabled'];
          setInterface(result);
        },
        setCallback,
        setInterface,
        setCollectionFields,
      }}
    >
      <SchemaInitializerItems {...props} items={items} />
      <ActionContextProvider
        value={{
          visible: Boolean(interfaceOptions),
          setVisible(v) {
            if (!v) {
              setInterface(null);
            }
          },
        }}
      >
        {interfaceOptions ? (
          <SchemaComponent
            schema={{
              type: 'void',
              name: 'drawer',
              title: '{{t("Configure field")}}',
              'x-decorator': 'FormV2',
              'x-decorator-props': {
                form,
              },
              'x-component': 'Action.Drawer',
              properties: {
                ...interfaceOptions.properties,
                footer: {
                  type: 'void',
                  'x-component': 'Action.Drawer.Footer',
                  properties: {
                    cancel: {
                      type: 'void',
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction() {
                          const form = useForm();
                          return {
                            async run() {
                              setCallback(null);
                              setInterface(null);
                              form.reset();
                            },
                          };
                        },
                      },
                    },
                    submit: {
                      type: 'void',
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction,
                      },
                    },
                  },
                },
              },
            }}
            components={{
              ArrayTable,
            }}
          />
        ) : null}
      </ActionContextProvider>
    </AddCustomFormFieldButtonContext.Provider>
  );
};

const commonOptions = {
  wrap: gridRowColWrap,
  insertPosition: 'beforeEnd',
  title: "{{t('Configure fields')}}",
  ItemsComponent: CustomItemsComponent,
};

/**
 * @deprecated
 * use `addCustomFormField` instead
 */
export const addCustomFormField_deprecated = new CompatibleSchemaInitializer({
  name: 'AddCustomFormField',
  ...commonOptions,
});

export const addCustomFormField = new CompatibleSchemaInitializer(
  {
    name: 'workflowManual:customForm:configureFields',
    ...commonOptions,
  },
  addCustomFormField_deprecated,
);

function CustomFormFieldInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { onAddField, setCallback } = useContext(AddCustomFormFieldButtonContext);
  const { getInterface } = useCollectionManager_deprecated();

  const interfaceOptions = getInterface(itemConfig.fieldInterface);

  return (
    <SchemaInitializerItem
      key={itemConfig.fieldInterface}
      onClick={() => {
        setCallback(() => insert);
        onAddField(interfaceOptions);
      }}
      {...itemConfig}
    />
  );
}

export default {
  title: `{{t("Custom form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer() {
      return {
        name: 'customForm',
        type: 'item',
        title: `{{t("Custom form", { ns: "${NAMESPACE}" })}}`,
        Component: CustomFormBlockInitializer,
      };
    },
    initializers: {},
    components: {
      CustomFormBlockProvider,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(root, (item) => item['x-decorator'] === 'CustomFormBlockProvider');
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        const fields = findSchema(
          formSchema.properties.grid,
          (item) => item['x-component'] === 'CollectionField',
          true,
        );
        formBlock['x-decorator-props'].collection.fields = fields.map(
          (field) => field['x-component-props']?.field ?? field['x-interface-options'],
        );
        //获取actionBar的schemakey
        const actionKey =
          Object.entries(formSchema.properties).find(([key, f]) => f['x-component'] === 'ActionBar')?.[0] || 'actions';
        forms[formKey] = {
          type: 'custom',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties[actionKey], (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
          ),
          collection: formBlock['x-decorator-props'].collection,
        };
      });
      return forms;
    },
  },
  block: {
    scope: {},
    components: {
      CustomFormBlockProvider,
    },
  },
} as ManualFormType;
