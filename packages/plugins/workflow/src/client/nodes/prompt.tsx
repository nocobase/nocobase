import React, { useState, useContext } from 'react';
import { useForm, Schema } from '@formily/react';
import { ArrayTable } from '@formily/antd';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons'
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
  useSchemaComponentContext,
  gridRowColWrap,
  InitializerWithSwitch,
} from '@nocobase/client';
import { merge, uid } from '@nocobase/utils/client';

import { useOperandContext, VariableComponent } from '../calculators';
import { instructions, useAvailableUpstreams } from '.';
import { useFlowContext } from '../FlowContext';
import { triggers } from '../triggers';
import { lang, NAMESPACE } from '../locale';
import CollectionFieldSelect from '../components/CollectionFieldSelect';

function useTrigger() {
  const { workflow } = useFlowContext();
  return triggers.get(workflow.type);
}

function useTriggerInitializers(): SchemaInitializerItemOptions | undefined {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers?.(workflow.config);
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
  const nodes = useAvailableUpstreams();
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
                                options.interface = interfaceOptions.name;
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

function ActionInitializer({ action, actionProps, ...props }) {
  return (
    <InitializerWithSwitch
      {...props}
      schema={{
        type: 'void',
        title: props.title,
        'x-decorator': 'PromptActionStatusProvider',
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
          key: 1,
          type: 'item',
          title: `{{t("Resolve", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: 1,
          actionProps: {
            type: 'primary',
          }
        },
        {
          key: -1,
          type: 'item',
          title: `{{t("Reject", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: -1,
          actionProps: {
            type: 'danger',
          }
        },
        {
          key: 0,
          type: 'item',
          title: `{{t("Save", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: 0,
        }
      ]}
      title="{{t('Configure actions')}}"
    />
  );
}

function FormConfig({ value, onChange }) {
  const ctx = useContext(SchemaComponentContext);
  const trigger = useTrigger();
  const nodes = useAvailableUpstreams();
  const form = useForm();

  const { collection = {
    name: uid(),
    fields: []
  }, blocks, actions } = value ?? {};

  const nodeInitializers = {};
  const nodeComponents = {};
  nodes.forEach(node => {
    const instruction = instructions.get(node.type);
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
  });

  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: true }}>
      <SchemaInitializerProvider initializers={{ AddBlockButton, AddFormField, AddActionButton, ...trigger.initializers, ...nodeInitializers }}>
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const { tabs, footer } = get(schema.toJSON(), 'properties.drawer.properties');
            const fields = [];
            findFormFields(tabs, fields);

            for(let i = collection.fields.length - 1; i >= 0; i--) {
              if (!fields.find(field => field.name === collection.fields[i].name)) {
                collection.fields.splice(i, 1);
              }
            }

            const actionKeys = Object.values(footer.properties.actions.properties)
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
                PromptActionStatusProvider(props) {
                  return props.children;
                }
              }}
              scope={{
                // NOTE: fake useAction for ui configuration
                useSubmit() {
                  return { run() {} }
                }
              }}
            />
          </CollectionProvider>
        </SchemaComponentRefreshProvider>
      </SchemaInitializerProvider>
    </SchemaComponentContext.Provider>
  );
}

function ValueGetter({ onChange }) {
  const { options } = useOperandContext();
  const { nodes } = useFlowContext();
  const { config } = nodes.find(n => n.id == options.nodeId);

  return (
    <CollectionFieldSelect
      fields={config.form.collection.fields}
      value={options?.path}
      onChange={(path) => {
        onChange(`{{$jobsMapByNodeId.${options.nodeId}.${path}}}`);
      }}
    />
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
          value: 1,
          label: (
            <Tooltip
              title={lang('Everyone should pass')}
              placement="bottom"
            >
              {lang('All pass')} <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
        },
        {
          value: -1,
          label: (
            <Tooltip
              title={lang('Anyone pass')}
              placement="bottom"
            >
              {lang('Any pass')} <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )
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
    'config.schema': {
      type: 'void',
      title: `{{t("Operation user interface", { ns: "${NAMESPACE}" })}}`,
      // 'x-decorator': 'FormItem',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        title: `{{t("Configure user interface", { ns: "${NAMESPACE}" })}}`,
      },
      properties: {
        schema: {
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': 'FormConfig',
        },
      }
    },
  },
  view: {

  },
  scope: {
  },
  components: {
    VariableComponent,
    FormConfig,
  },
  useValueGetter({ config }) {
    if (!config.form?.collection?.fields?.length) {
      return null;
    }
    return ValueGetter;
  }
};
