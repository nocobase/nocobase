import React, { useState, useContext } from 'react';
import { Field } from '@formily/core';
import { useForm, Schema, useFieldSchema } from '@formily/react';
import { ArrayTable } from '@formily/antd';
import { cloneDeep, get, set } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
  CollectionProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  InitializerWithSwitch,
  SchemaInitializerProvider,
  useSchemaComponentContext,
  gridRowColWrap,
  useCollectionManager,
  ActionContext,
  CollectionContext,
  GeneralSchemaDesigner,
  SchemaSettings,
  useCompile
} from '@nocobase/client';
import { merge, uid } from '@nocobase/utils/client';
import { useTrigger } from '../../triggers';
import { instructions, useAvailableUpstreams, useNodeContext } from '..';
import { useFlowContext } from '../../FlowContext';
import { lang, NAMESPACE } from '../../locale';
import { JOB_STATUS } from '../../constants';



function useTriggerInitializers(): SchemaInitializerItemOptions | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers? trigger.useInitializers(workflow.config) : null;
};

const blockTypeNames = {
  'customForm': `{{t("Custom Form", { ns: "${NAMESPACE}" })}}`,
  'record': `{{t("Data record", { ns: "${NAMESPACE}" })}}`,
};

function SimpleDesigner() {
  const schema = useFieldSchema();
  const title = blockTypeNames[schema['x-designer-props']?.type] ?? '{{t("Block")}}';
  const compile = useCompile();
  return (
    <GeneralSchemaDesigner title={compile(title)}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
}

const FormCollectionContext = React.createContext<any>(null);

function FormCollectionProvider(props) {
  const [fields, setCollectionFields] = useState(props.collection?.fields ?? []);

  return (
    <FormCollectionContext.Provider value={{ setCollectionFields }}>
      <CollectionProvider
        collection={{
          ...props.collection,
          fields
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
              fields: []
            }
          },
          'x-component': 'CardItem',
          'x-component-props': {
            title: '{{t("Form")}}',
          },
          'x-designer': 'SimpleDesigner',
          'x-designer-props': {
            type: 'customForm'
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'FormV2',
              'x-component-props': {
                // disabled / read-pretty / initialValues
                useProps: '{{ useFormBlockProps }}'
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
                        value: JOB_STATUS.RESOLVED
                      },
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: '{{ useSubmit }}',
                      },
                      'x-designer': 'Action.Designer',
                      'x-action': `${JOB_STATUS.RESOLVED}`,
                    }
                  }
                }
              }
            }
          }
        });
      }}
    />
  );
}

function AddBlockButton(props: any) {
  const current = useNodeContext();
  const nodes = useAvailableUpstreams(current);
  const triggerInitializers = [useTriggerInitializers()].filter(Boolean);
  const nodeBlockInitializers = nodes.map((node) => {
    const instruction = instructions.get(node.type);
    return instruction?.useInitializers?.(node);
  }).filter(Boolean);
  const dataBlockInitializers = [
    ...triggerInitializers,
    ...(nodeBlockInitializers.length ? [{
      key: 'nodes',
      type: 'subMenu',
      title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
      children: nodeBlockInitializers
    }] : []),
  ].filter(Boolean);

  const items = [
    ...(dataBlockInitializers.length ? [{
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: dataBlockInitializers
    }] : []),
    {
      type: 'itemGroup',
      title: '{{t("Form")}}',
      children: [
        {
          key: 'customForm',
          type: 'item',
          title: '{{t("Custom form")}}',
          component: CustomFormBlockInitializer
        },
        // {
        //   key: 'createForm',
        //   type: 'item',
        //   title: '{{t("Create record form")}}',
        //   component: CustomFormBlockInitializer,
        // },
        // {
        //   key: 'updateForm',
        //   type: 'item',
        //   title: '{{t("Update record form")}}',
        //   component: CustomFormBlockInitializer,
        // }
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Markdown")}}',
          component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ] as SchemaInitializerItemOptions[];

  return (
    <SchemaInitializer.Button
      {...props}
      wrap={gridRowColWrap}
      items={items}
      title="{{t('Add block')}}"
    />
  );
};

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
    .filter(groupName => ['basic', 'choices', 'datetime', 'media'].includes(groupName))
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

  return options.map(group => ({
    key: group.title,
    type: 'itemGroup',
    title: group.title,
    children: group.children.map(item => ({
      key: item.name,
      type: 'item',
      title: item.title,
      component: CustomFormFieldInitializer,
      fieldInterface: item.name,
    }))
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
    <AddCustomFormFieldButtonContext.Provider value={{
      onAddField(item) {
        const { properties: { unique, type, ...properties }, ...options } = cloneDeep(item);
        delete properties.name['x-disabled'];
        setInterface({
          ...options,
          properties
        });
      },
      setCallback
    }}>
      <SchemaInitializer.Button
        wrap={gridRowColWrap}
        insertPosition={insertPosition}
        items={items}
        component={component}
        title="{{t('Configure fields')}}"
      />
      <ActionContext.Provider value={{ visible: Boolean(interfaceOptions) }}>
        {interfaceOptions
          ? (
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
                          }
                        }
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
                                const existed = collection.fields?.find(item => item.name === options.name);
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
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }}
              components={{
                ArrayTable
              }}
            />
          )
          : null}
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
};

function findSchema(schema, filter, onlyLeaf = false) {
  const result = [];

  if (!schema) {
    return result;
  }

  if (filter(schema) && (!onlyLeaf || !schema.properties)) {
    result.push(schema);
    return result;
  }

  if (schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      result.push(...findSchema(schema.properties[key], filter));
    });
  }
  return result;
}

function SchemaComponentRefreshProvider(props) {
  const ctx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        refresh() {
          ctx?.refresh?.();
          props?.onRefresh?.();
        },
      }}
    >
      {props.children}
    </SchemaComponentContext.Provider>
  );
};

function ActionInitializer({ action, actionProps, ...props }) {
  return (
    <InitializerWithSwitch
      {...props}
      schema={{
        type: 'void',
        title: props.title,
        'x-decorator': 'ManualActionStatusProvider',
        'x-decorator-props': {
          value: action
        },
        'x-component': 'Action',
        'x-component-props': {
          ...actionProps,
          useAction: '{{ useSubmit }}',
        },
        'x-designer': 'Action.Designer',
        'x-action': `${action}`,
      }}
      type="x-action"
    />
  );
}

function AddActionButton(props) {
  return (
    <SchemaInitializer.Button
      {...props}
      items={[
        {
          key: JOB_STATUS.RESOLVED,
          type: 'item',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.RESOLVED,
          actionProps: {
            type: 'primary',
          }
        },
        {
          key: JOB_STATUS.REJECTED,
          type: 'item',
          title: `{{t("Terminate the process", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.REJECTED,
          actionProps: {
            type: 'danger',
          }
        },
        {
          key: JOB_STATUS.PENDING,
          type: 'item',
          title: `{{t("Save temporarily", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.PENDING,
        }
      ]}
      title="{{t('Configure actions')}}"
    />
  );
}

// NOTE: fake useAction for ui configuration
function useSubmit() {
  // const { values, submit, id: formId } = useForm();
  // const formSchema = useFieldSchema();
  return {
    run() {
    }
  };
}

function useFlowRecordFromBlock() {
  return {};
}

export function SchemaConfig({ value, onChange }) {
  const ctx = useContext(SchemaComponentContext);
  const trigger = useTrigger();
  const node = useNodeContext();
  const nodes = useAvailableUpstreams(node);
  const form = useForm();
  const { workflow } = useFlowContext();

  const nodeInitializers = {};
  const nodeComponents = {};
  nodes.forEach(item => {
    const instruction = instructions.get(item.type);
    Object.assign(nodeInitializers, instruction.initializers);
    Object.assign(nodeComponents, instruction.components);
  });

  const schema = new Schema({
    properties: {
      drawer: {
        type: 'void',
        title: '{{t("Configure form")}}',
        'x-decorator': 'Form',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'TabPaneInitializers',
            'x-initializer-props': {
              gridInitializer: 'AddBlockButton'
            },
            properties: value ?? {
              tab1: {
                type: 'void',
                title: `{{t("Manual", { ns: "${NAMESPACE}" })}}`,
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'AddBlockButton',
                    properties: {}
                  },
                },
              }
            }
          }
        }
      }
    },
  });

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: !workflow.executed }}>
      <SchemaInitializerProvider initializers={{ AddBlockButton, AddCustomFormField, AddActionButton, ...trigger.initializers, ...nodeInitializers }}>
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const forms = {};
            const { tabs } = get(schema.toJSON(), 'properties.drawer.properties');
            const formBlocks: any[] = findSchema(tabs, item => item['x-decorator'] === 'FormCollectionProvider');
            formBlocks.forEach(formBlock => {
              const [formKey] = Object.keys(formBlock.properties);
              const formSchema = formBlock.properties[formKey];
              const fields = findSchema(formSchema.properties.grid, item => item['x-component'] === 'CollectionField', true);
              formBlock['x-decorator-props'].collection.fields = fields.map(field => field['x-interface-options']);
              forms[formKey] = {
                type: 'custom',
                title: formBlock['x-component-props']?.title || formKey,
                actions: findSchema(formSchema.properties.actions, item => item['x-component'] === 'Action')
                  .map(item => item['x-decorator-props'].value),
                collection: formBlock['x-decorator-props'].collection
              };
            });

            form.setValuesIn('forms', forms);

            onChange(tabs.properties);
          }}
        >
          <SchemaComponent
            schema={schema}
            components={{
              ...nodeComponents,
              // NOTE: fake provider component
              ManualActionStatusProvider(props) {
                return props.children;
              },
              ActionBarProvider(props) {
                return props.children;
              },
              SimpleDesigner,
              FormCollectionProvider
            }}
            scope={{
              useSubmit,
              useFlowRecordFromBlock
            }}
          />
        </SchemaComponentRefreshProvider>
      </SchemaInitializerProvider>
    </SchemaComponentContext.Provider>
  );
}

export function SchemaConfigButton(props) {
  const { workflow } = useFlowContext();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div className="ant-btn ant-btn-primary" onClick={() => setVisible(true)}>
        {workflow.executed ? lang('View user interface') : lang('Configure user interface')}
      </div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        {props.children}
      </ActionContext.Provider>
    </>
  );
}
