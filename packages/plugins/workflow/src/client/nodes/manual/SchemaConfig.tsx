import React, { useState, useContext, useMemo } from 'react';

import { useForm, ISchema, Schema, useFieldSchema } from '@formily/react';
import { get } from 'lodash';

import {
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  InitializerWithSwitch,
  SchemaInitializerProvider,
  gridRowColWrap,
  ActionContext,
  GeneralSchemaDesigner,
  SchemaSettings,
  useCompile,
} from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';

import { useTrigger } from '../../triggers';
import { instructions, useAvailableUpstreams, useNodeContext } from '..';
import { useFlowContext } from '../../FlowContext';
import { lang, NAMESPACE } from '../../locale';
import { JOB_STATUS } from '../../constants';
import customForm from './forms/custom';
import createForm from './forms/create';
import updateForm from './forms/update';
import { FormBlockProvider } from './FormBlockProvider';

type ValueOf<T> = T[keyof T];

export type FormType = {
  type: 'create' | 'update' | 'custom';
  title: string;
  actions: ValueOf<typeof JOB_STATUS>[];
  collection:
    | string
    | {
        name: string;
        fields: any[];
        [key: string]: any;
      };
};

export type ManualFormType = {
  title: string;
  config: {
    useInitializer: () => SchemaInitializerItemOptions;
    initializers?: {
      [key: string]: React.FC;
    };
    components?: {
      [key: string]: React.FC;
    };
    parseFormOptions(root: ISchema): { [key: string]: FormType };
  };
  block: {
    scope?: {
      [key: string]: () => any;
    };
    components?: {
      [key: string]: React.FC;
    };
  };
};

export const manualFormTypes = new Registry<ManualFormType>();

manualFormTypes.register('customForm', customForm);
manualFormTypes.register('createForm', createForm);
manualFormTypes.register('updateForm', updateForm);

function useTriggerInitializers(): SchemaInitializerItemOptions | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers ? trigger.useInitializers(workflow.config) : null;
}

const blockTypeNames = {
  customForm: customForm.title,
  record: `{{t("Data record", { ns: "${NAMESPACE}" })}}`,
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
  const nodeBlockInitializers = nodes
    .map((node) => {
      const instruction = instructions.get(node.type);
      return instruction?.useInitializers?.(node);
    })
    .filter(Boolean);
  const dataBlockInitializers = [
    ...triggerInitializers,
    ...(nodeBlockInitializers.length
      ? [
          {
            key: 'nodes',
            type: 'subMenu',
            title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
            children: nodeBlockInitializers,
          },
        ]
      : []),
  ].filter(Boolean);

  const items = [
    ...(dataBlockInitializers.length
      ? [
          {
            type: 'itemGroup',
            title: '{{t("Data blocks")}}',
            children: dataBlockInitializers,
          },
        ]
      : []),
    {
      type: 'itemGroup',
      title: '{{t("Form")}}',
      children: Array.from(manualFormTypes.getValues()).map((item) => {
        const { useInitializer: getInitializer } = item.config;
        return getInitializer();
      }),
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

  return <SchemaInitializer.Button {...props} wrap={gridRowColWrap} items={items} title="{{t('Add block')}}" />;
}

function ActionInitializer({ action, actionProps, ...props }) {
  return (
    <InitializerWithSwitch
      {...props}
      schema={{
        type: 'void',
        title: props.title,
        'x-decorator': 'ManualActionStatusProvider',
        'x-decorator-props': {
          value: action,
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
          },
        },
        {
          key: JOB_STATUS.REJECTED,
          type: 'item',
          title: `{{t("Terminate the process", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.REJECTED,
          actionProps: {
            type: 'danger',
          },
        },
        {
          key: JOB_STATUS.PENDING,
          type: 'item',
          title: `{{t("Save temporarily", { ns: "${NAMESPACE}" })}}`,
          component: ActionInitializer,
          action: JOB_STATUS.PENDING,
        },
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
    run() {},
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
  nodes.forEach((item) => {
    const instruction = instructions.get(item.type);
    Object.assign(nodeInitializers, instruction.initializers);
    Object.assign(nodeComponents, instruction.components);
  });

  const schema = useMemo(
    () =>
      new Schema({
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
                  gridInitializer: 'AddBlockButton',
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
                        properties: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    [],
  );

  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        designable: !workflow.executed,
        refresh() {
          ctx.refresh?.();
          const { tabs } = get(schema.toJSON(), 'properties.drawer.properties') as { tabs: ISchema };
          const forms = Array.from(manualFormTypes.getValues()).reduce(
            (result, item) => Object.assign(result, item.config.parseFormOptions(tabs)),
            {},
          );
          form.setValuesIn('forms', forms);

          onChange(tabs.properties);
        },
      }}
    >
      <SchemaInitializerProvider
        initializers={{
          AddBlockButton,
          AddActionButton,
          ...trigger.initializers,
          ...nodeInitializers,
          ...Array.from(manualFormTypes.getValues()).reduce(
            (result, item) => Object.assign(result, item.config.initializers),
            {},
          ),
        }}
      >
        <SchemaComponent
          schema={schema}
          components={{
            ...nodeComponents,
            ...Array.from(manualFormTypes.getValues()).reduce(
              (result, item) => Object.assign(result, item.config.components),
              {},
            ),
            FormBlockProvider,
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
            useFlowRecordFromBlock,
          }}
        />
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
      <ActionContext.Provider value={{ visible, setVisible }}>{props.children}</ActionContext.Provider>
    </>
  );
}
