import React, { useState, useContext } from 'react';

import { useForm, ISchema, Schema, useFieldSchema } from '@formily/react';
import { get } from 'lodash';

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
import { useTrigger } from '../../triggers';
import { instructions, useAvailableUpstreams, useNodeContext } from '..';
import { useFlowContext } from '../../FlowContext';
import { lang, NAMESPACE } from '../../locale';
import { JOB_STATUS } from '../../constants';
import customForm from './forms/customForm';



function useTriggerInitializers(): SchemaInitializerItemOptions | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers? trigger.useInitializers(workflow.config) : null;
};

const blockTypeNames = {
  'customForm': customForm.title,
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
        customForm.initializer,
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
      <SchemaInitializerProvider
        initializers={{
          AddBlockButton,
          AddActionButton,
          ...trigger.initializers,
          ...nodeInitializers,
          ...customForm.initializers,
        }}
      >
        <SchemaComponentRefreshProvider
          onRefresh={() => {
            const forms = {};
            const { tabs } = get(schema.toJSON(), 'properties.drawer.properties') as { tabs: ISchema };
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
              ...customForm.components,
              // NOTE: fake provider component
              ManualActionStatusProvider(props) {
                return props.children;
              },
              ActionBarProvider(props) {
                return props.children;
              },
              SimpleDesigner,
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
