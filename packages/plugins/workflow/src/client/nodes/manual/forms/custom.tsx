import React, { useState, useContext } from 'react';

import { cloneDeep, set } from 'lodash';
import { Field } from '@formily/core';
import { useForm } from '@formily/react';
import { ArrayTable } from '@formily/antd';

import {
  ActionContext,
  CollectionContext,
  CollectionProvider,
  gridRowColWrap,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  useCollectionManager,
} from '@nocobase/client';
import { merge, uid } from '@nocobase/utils/client';

import { JOB_STATUS } from '../../../constants';
import { lang, NAMESPACE } from '../../../locale';
import { findSchema } from '../utils';
import { ManualFormType } from '../SchemaConfig';

const FormCollectionContext = React.createContext<any>(null);

function FormCollectionProvider(props) {
  const [fields, setCollectionFields] = useState(props.collection?.fields ?? []);

  return (
    <FormCollectionContext.Provider value={{ setCollectionFields }}>
      <CollectionProvider
        collection={{
          ...props.collection,
          fields,
        }}
      >
        {props.children}
      </CollectionProvider>
    </FormCollectionContext.Provider>
  );
}

function CustomFormBlockInitializer({ insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-decorator': 'FormCollectionProvider',
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
                      'x-designer': 'Action.Designer',
                      'x-action': `${JOB_STATUS.RESOLVED}`,
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

function useCommonInterfaceInitializers(): SchemaInitializerItemOptions[] {
  const { interfaces } = useCollectionManager();
  const options = getOptions(interfaces);

  return options.map((group) => ({
    key: group.title,
    type: 'itemGroup',
    title: group.title,
    children: group.children.map((item) => ({
      key: item.name,
      type: 'item',
      title: item.title,
      component: CustomFormFieldInitializer,
      fieldInterface: item.name,
    })),
  }));
}

const AddCustomFormFieldButtonContext = React.createContext<any>({});

function AddCustomFormField(props) {
  const { insertPosition = 'beforeEnd', component } = props;
  const items = useCommonInterfaceInitializers();
  const collection = useContext(CollectionContext);
  const [interfaceOptions, setInterface] = useState<any>(null);
  const [insert, setCallback] = useState<any>();
  const { setCollectionFields } = useContext(FormCollectionContext);

  return (
    <AddCustomFormFieldButtonContext.Provider
      value={{
        onAddField(item) {
          const {
            properties: { unique, type, ...properties },
            ...options
          } = cloneDeep(item);
          delete properties.name['x-disabled'];
          setInterface({
            ...options,
            properties,
          });
        },
        setCallback,
      }}
    >
      <SchemaInitializer.Button
        wrap={gridRowColWrap}
        insertPosition={insertPosition}
        items={items}
        component={component}
        title="{{t('Configure fields')}}"
      />
      <ActionContext.Provider value={{ visible: Boolean(interfaceOptions) }}>
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
                                  messages: [lang('Field name existed in form')],
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
                                'x-interface-options': newField,
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
      </ActionContext.Provider>
    </AddCustomFormFieldButtonContext.Provider>
  );
}

function CustomFormFieldInitializer(props) {
  const { item, insert } = props;
  const { onAddField, setCallback } = useContext(AddCustomFormFieldButtonContext);
  const { getInterface } = useCollectionManager();

  const interfaceOptions = getInterface(item.fieldInterface);

  return (
    <SchemaInitializer.Item
      key={item.fieldInterface}
      onClick={() => {
        setCallback(() => insert);
        onAddField(interfaceOptions);
      }}
    />
  );
}

export default {
  title: `{{t("Custom form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer() {
      return {
        key: 'customForm',
        type: 'item',
        title: `{{t("Custom form", { ns: "${NAMESPACE}" })}}`,
        component: CustomFormBlockInitializer,
      };
    },
    initializers: {
      AddCustomFormField,
    },
    components: {
      FormCollectionProvider,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(root, (item) => item['x-decorator'] === 'FormCollectionProvider');
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        const fields = findSchema(
          formSchema.properties.grid,
          (item) => item['x-component'] === 'CollectionField',
          true,
        );
        formBlock['x-decorator-props'].collection.fields = fields.map((field) => field['x-interface-options']);
        forms[formKey] = {
          type: 'custom',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => item['x-decorator-props'].value,
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
      FormCollectionProvider: CollectionProvider,
    },
  },
} as ManualFormType;
