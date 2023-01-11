import React, { useState, useContext } from 'react';
import { useForm, Schema } from '@formily/react';
import { ArrayTable } from '@formily/antd';
import { cloneDeep, get, set } from 'lodash';

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
  CollectionContext
} from '@nocobase/client';
import { merge, uid } from '@nocobase/utils/client';
import { useTrigger } from '../../triggers';
import { instructions, useAvailableUpstreams, useNodeContext } from '..';
import { useFlowContext } from '../../FlowContext';
import { NAMESPACE } from '../../locale';
import { JOB_STATUS } from '../../constants';



function useTriggerInitializers(): SchemaInitializerItemOptions | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers? trigger.useInitializers(workflow.config) : null;
};

function FormBlockInitializer({ insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'FormV2.Designer',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'AddFormField',
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
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: FormBlockInitializer
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
                                options.interface = interfaceOptions.name;
                                collection.fields?.push(merge(options, values) as any);
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
          key: JOB_STATUS.RESOLVED,
          type: 'item',
          title: `{{t("Resolve", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.RESOLVED,
          actionProps: {
            type: 'primary',
          }
        },
        {
          key: JOB_STATUS.REJECTED,
          type: 'item',
          title: `{{t("Reject", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.REJECTED,
          actionProps: {
            type: 'danger',
          }
        },
        {
          key: JOB_STATUS.PENDING,
          type: 'item',
          title: `{{t("Save", { ns: "${NAMESPACE}" })}}`,
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
  return { run() {} }
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

  const { collection = {
    name: uid(),
    fields: []
  }, blocks, actions } = value ?? {};

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
            properties: blocks ?? {
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
                properties: actions ?? {
                  resolve: {
                    type: 'void',
                    title: `{{t("Resolve", { ns: "${NAMESPACE}" })}}`,
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
                    'x-action': JOB_STATUS.RESOLVED,
                  }
                }
              }
            }
          }
        }
      }
    },
  });

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: !node.job }}>
      <SchemaInitializerProvider initializers={{ AddBlockButton, AddFormField, AddActionButton, ...trigger.initializers, ...nodeInitializers }}>
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const { tabs, footer } = get(schema.toJSON(), 'properties.drawer.properties');
            const fields: any[] = [];
            findFormFields(tabs, fields);

            for(let i = collection.fields.length - 1; i >= 0; i--) {
              if (!fields.find(field => field.name === collection.fields[i].name)) {
                collection.fields.splice(i, 1);
              }
            }

            const actionKeys = (Object.values(footer.properties.actions.properties ?? {}) as any[])
              .reduce((actions: number[], { ['x-action']: status }) => actions.concat(status), []);
            form.setValuesIn('config.actions', actionKeys);

            onChange({
              collection,
              blocks: tabs.properties,
              actions: footer.properties.actions.properties
            });
          }}
        >
          <CollectionProvider collection={collection}>
            <SchemaComponent
              schema={schema}
              components={{
                ...nodeComponents,
                // NOTE: fake provider component
                ManualActionStatusProvider(props) {
                  return props.children;
                }
              }}
              scope={{
                useSubmit,
                useFlowRecordFromBlock
              }}
            />
          </CollectionProvider>
        </SchemaComponentRefreshProvider>
      </SchemaInitializerProvider>
    </SchemaComponentContext.Provider>
  );
}
