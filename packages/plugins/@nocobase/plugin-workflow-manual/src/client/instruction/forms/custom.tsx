import React, { useContext, useMemo, useState } from 'react';

import { ArrayTable } from '@formily/antd-v5';
import { Field, createForm } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import lodash from 'lodash';

import {
  ActionContextProvider,
  CollectionContext,
  CollectionProvider,
  FormBlockContext,
  RecordProvider,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  SchemaInitializerItems,
  gridRowColWrap,
  useCollectionManager,
  useRecord,
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
  const userJob = useRecord();
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

  return !userJob.status || values ? (
    <CollectionProvider
      collection={{
        ...props.collection,
        fields,
      }}
    >
      <RecordProvider record={values} parent={false}>
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
    </CollectionProvider>
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
              'x-component-props': {
                // disabled / read-pretty / initialValues
                useProps: '{{ useFormBlockProps }}',
              },
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'AddCustomFormField',
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
                  'x-initializer': 'AddActionButton',
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
    lodash.set(fields, [group, type], schema);
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
  const { interfaces } = useCollectionManager();
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

const CustomItemsComponent = (props) => {
  const [interfaceOptions, setInterface] = useState<any>(null);
  const [insert, setCallback] = useState<any>();
  const items = useCommonInterfaceInitializers();
  const collection = useContext(CollectionContext);
  const { setCollectionFields } = useContext(FormBlockContext);

  return (
    <AddCustomFormFieldButtonContext.Provider
      value={{
        onAddField(item) {
          const {
            properties: { unique, type, ...properties },
            ...options
          } = lodash.cloneDeep(item);
          delete properties.name['x-disabled'];
          setInterface({
            ...options,
            properties,
          });
        },
        setCallback,
      }}
    >
      <SchemaInitializerItems {...props} items={items} />
      <ActionContextProvider value={{ visible: Boolean(interfaceOptions) }}>
        {interfaceOptions ? (
          <SchemaComponent
            schema={{
              type: 'void',
              name: 'drawer',
              title: '{{t("Configure field")}}',
              'x-decorator': 'Form',
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
                        useAction() {
                          const { values, query } = useForm();
                          const messages = [useLang('Field name existed in form')];
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
                                'x-designer': 'FormItem.Designer',
                              });
                              setCallback(null);
                              setInterface(null);
                            },
                          };
                        },
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

export const addCustomFormField: SchemaInitializer = new SchemaInitializer({
  name: 'AddCustomFormField',
  wrap: gridRowColWrap,
  insertPosition: 'beforeEnd',
  title: "{{t('Configure fields')}}",
  ItemsComponent: CustomItemsComponent,
});

function CustomFormFieldInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { insert, setVisible } = useSchemaInitializer();
  const { onAddField, setCallback } = useContext(AddCustomFormFieldButtonContext);
  const { getInterface } = useCollectionManager();

  const interfaceOptions = getInterface(itemConfig.fieldInterface);

  return (
    <SchemaInitializerItem
      key={itemConfig.fieldInterface}
      onClick={() => {
        setCallback(() => insert);
        onAddField(interfaceOptions);
        setVisible(false);
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
        forms[formKey] = {
          type: 'custom',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
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
