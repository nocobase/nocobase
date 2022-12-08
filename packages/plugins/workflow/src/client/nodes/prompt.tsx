import React, { useState, useContext } from 'react';
import { createForm } from '@formily/core';
import { useForm, Schema } from '@formily/react';
import { ArrayTable } from '@formily/antd';
import { cloneDeep, get, set } from 'lodash';

import {
  ActionContext,
  CollectionContext,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  SchemaInitializerProvider,
  useCollectionManager,
  useCompile,
  useDesignable,
  useRequest,
  useSchemaComponentContext,
  gridRowColWrap,
  InitializerWithSwitch
} from '@nocobase/client';
import { merge, uid } from '@nocobase/utils/client';

import { VariableComponent } from '../calculators';
import { instructions, NodeContext, useAvailableUpstreams, useNodeContext } from '.';
import { useFlowContext } from '../FlowContext';
import { triggers } from '../triggers';
import { NAMESPACE } from '../locale';

function useTrigger() {
  const { workflow } = useFlowContext();
  return triggers.get(workflow.type);
}

function useTriggerInitializers(): SchemaInitializerItemOptions | undefined {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers?.(workflow.config);
};


function useNodeJobResultInitializerFields() {
  const node = useNodeContext();

  const upstreams = [];
  for (let n = node.upstream; n; n = n.upstream) {
    const { useFields } = instructions.get(n.type);
    if (useFields) {
      upstreams.push({
        type: 'void',
        'x-component': 'NodeJobResultContainer',
        'x-context-block': 'nodeJobResult'
      });
    }
  }
  return upstreams;
}

const ActionOptions = [
  {
    value: 1,
    label: 'Resolve',
  },
  {
    value: -1,
    label: 'Reject',
  },
  {
    value: 0,
    label: 'Save',
  }
] as const;

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

function SchemaComponentRefreshProvider(props) {
  const ctx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        refresh() {
          ctx.refresh();
          props?.onRefresh?.();
        },
      }}
    >
      {props.children}
    </SchemaComponentContext.Provider>
  );
};

function NodeResultInitializer(props) {
  const { item, insert } = props;
  const node = useNodeContext();
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'div',
          'x-content': node.title ?? node.id,
        });
      }}
    />
  );
}

function FormBlockInitializer({ form, insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          title: 'test form block',
          'x-decorator': 'Form',
          'x-component': 'CardItem',
          'x-designer': 'FormV2.Designer',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'AddFormField',
              properties: form
            }
          }
        });
      }}
    />
  );
}

function AddBlockButton(props: any) {
  const { insertPosition = 'beforeEnd', component, form } = props;
  const nodes = useAvailableUpstreams();
  const triggerInitializers = [useTriggerInitializers()].filter(Boolean);

  const items = [
    {
      type: 'itemGroup',
      title: '{{t("Data")}}',
      children: [
        ...triggerInitializers,
        {
          key: 'nodes',
          type: 'subMenu',
          title: 'Node result',
          children: nodes.map((node) => ({
            key: node.id,
            type: 'item',
            title: node.title ?? `#${node.id}`,
            component(p) {
              return (
                <NodeContext.Provider key={node.id} value={node}>
                  <NodeResultInitializer {...p} />
                </NodeContext.Provider>
              );
            },
          }))
        },
      ]
    },
    {
      type: 'itemGroup',
      title: '{{t("Form")}}',
      children: [
        {
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: FormBlockInitializer,
          form,
        },
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
      insertPosition={insertPosition}
      wrap={gridRowColWrap}
      items={items}
      component={component}
      title="{{t('Add block')}}"
    />
  );
};


function FormFieldInitializer(props) {
  const { item, insert } = props;
  const { onAddField, setCallback } = useContext(AddFormFieldButtonContext);
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
      component: FormFieldInitializer,
      fieldInterface: item.name,
    }))
  }));
}

const AddFormFieldButtonContext = React.createContext<any>({});

function AddFormField(props) {
  const { insertPosition = 'beforeEnd', component } = props;
  const items = useCommonInterfaceInitializers();
  const collection = useContext(CollectionContext);
  const [interfaceOptions, setInterface] = useState<any>(null);
  const [insert, setCallback] = useState<any>();

  return (
    <AddFormFieldButtonContext.Provider value={{
      onAddField(item) {
        const { properties: { unique, ...properties }, ...options } = cloneDeep(item);
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
                            const { values } = useForm();
                            return {
                              async run() {
                                const { default: options } = interfaceOptions;
                                const defaultName = uid();
                                options.name = values.name ?? defaultName;
                                options.uiSchema.title = values.uiSchema?.title ?? defaultName;
                                collection.fields.push(merge(options, values) as any);
                                insert({
                                  name: options.name,
                                  type: options.uiSchema.type,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'CollectionField',
                                  'x-component-props': {},
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
    </AddFormFieldButtonContext.Provider>
  );
}

function findFormFields(formSchema, fields) {
  if (!formSchema) {
    return;
  }

  if (!formSchema.properties) {
    if (formSchema['x-component'] === 'CollectionField') {
      fields.push(formSchema);
    }
    return;
  }

  Object.keys(formSchema.properties).forEach(key => {
    findFormFields(formSchema.properties[key], fields);
  });
}

function ActionInitializer({ action, actionType, ...props }) {
  return (
    <InitializerWithSwitch
      {...props}
      schema={{
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          type: actionType
        },
        'x-action': action,
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
          key: 'resolve',
          type: 'item',
          title: 'Resovle',
          component: ActionInitializer,
          action: 'resolve',
          actionType: 'primary'
        },
        {
          key: 'reject',
          type: 'item',
          title: 'Reject',
          component: ActionInitializer,
          action: 'reject',
          actionType: 'danger'
        },
        {
          key: 'save',
          type: 'item',
          title: 'Save',
          component: ActionInitializer,
          action: 'save',
        }
      ]}
      title="{{t('Add Action')}}"
    />
  );
}

function FormConfig({ value, onChange }) {
  const ctx = useContext(SchemaComponentContext);
  const { collection = {
    name: uid(),
    fields: []
  }, blocks, actions } = value ?? {};
  const trigger = useTrigger();

  const schema = new Schema({
    properties: {
      drawer: {
        type: 'void',
        title: '{{t("Configure form")}}',
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
            properties: blocks ?? {
              tab1: {
                type: 'void',
                title: `{{t("Prompt")}}`,
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
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            'x-component-props': {
              style: {
                background: '#fff'
              }
            },
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-initializer': 'AddActionButton',
                properties: actions ?? {}
              }
            }
          }
        }
      }
    },
    // properties: {
    //   view: {
    //     type: 'void',
    //     'x-component': 'Grid',
    //     'x-initializer': 'AddBlockButton',
    //     'x-initializer-props': {
    //       collection,
    //     },
    //     properties: blocks
    //   },
    // }
  });

  const form = createForm();

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: true }}>
      <SchemaInitializerProvider initializers={{ AddBlockButton, AddFormField, AddActionButton, ...trigger.initializers }}>
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const blocks = get(schema.toJSON(), 'properties.drawer.properties.tabs.properties');
            console.log('---->', blocks, collection);
            onChange({ ...value, blocks, collection });
          }}
        >
          <CollectionProvider collection={collection}>
            <SchemaComponent schema={schema} />
          </CollectionProvider>
        </SchemaComponentRefreshProvider>
      </SchemaInitializerProvider>
    </SchemaComponentContext.Provider>
  );
}

function FormActions({ value, onChange }) {
  const ctx = useContext(SchemaComponentContext);
  const { actions = {} } = value ?? {};
  const schema = new Schema({
    properties: {
      actions: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-initializer': 'AddActionButton',
        properties: actions
      }
    }
  });

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: true }}>
      <SchemaInitializerProvider initializers={{ AddActionButton }}>
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const result = get(schema.toJSON(), 'properties.view.properties');
            console.log(result);
            // onChange({ ...value, actions });
          }}
        >
          <SchemaComponent schema={schema} />
        </SchemaComponentRefreshProvider>
      </SchemaInitializerProvider>
    </SchemaComponentContext.Provider>
  );
}

export default {
  title: `{{t("Prompt", { ns: "${NAMESPACE}" })}}`,
  type: 'prompt',
  group: 'manual',
  fieldset: {
    'config.assignees': {
      type: 'array',
      name: 'config.assignees',
      title: `{{t("Assignees", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RemoteSelect',
      'x-component-props': {
        multiple: true,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        service: {
          resource: 'users'
        },
      },
      default: [],
    },
    'config.mode': {
      type: 'number',
      name: 'config.mode',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        {
          label: `{{t("All", { ns: "${NAMESPACE}" })}}`,
          value: 1
        },
        {
          label: `{{t("Any", { ns: "${NAMESPACE}" })}}`,
          value: -1
        },
      ],
      'x-reactions': {
        dependencies: ['config.assignees'],
        fulfill: {
          state: {
            visible: '{{$deps[0].length > 1}}',
          },
        },
      }
    },
    'config.form': {
      type: 'void',
      title: '{{t("Prompt form")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
      },
      properties: {
        'config.form': {
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': 'FormConfig',
        },
      }
      // properties: {
      //   drawer: {
      //     type: 'void',
      //     title: '{{t("Configure form")}}',
      //     'x-component': 'Action.Drawer',
      //     'x-component-props': {
      //       className: 'nb-action-popup',
      //     },
      //     properties: {
      //       'config.form': {
      //         type: 'object',
      //         // name: 'config.form',
      //         'x-decorator': 'FormItem',
      //         'x-component': 'FormConfig',
      //       },
      //       'config.actions': {
      //         type: 'void',
      //         'x-component': 'Action.Drawer.Footer',
      //         properties: {
      //           'config.actions': {
      //             'x-decorator': 'FormItem',
      //             'x-component': 'FormActions',
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
    },
  },
  view: {

  },
  scope: {
    useUserDataSource() {

    }
  },
  components: {
    VariableComponent,
    FormConfig,
    FormActions,
  }
};
