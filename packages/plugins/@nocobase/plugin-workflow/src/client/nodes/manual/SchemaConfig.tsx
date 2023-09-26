import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormProvider, ISchema, Schema, useFieldSchema, useForm } from '@formily/react';
import { Alert, Button, Modal, Space } from 'antd';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Action,
  ActionContextProvider,
  GeneralSchemaDesigner,
  InitializerWithSwitch,
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  SchemaInitializerProvider,
  SchemaSettings,
  VariableScopeProvider,
  gridRowColWrap,
  useCollectionManager,
  useCompile,
  useFormBlockContext,
  useSchemaOptionsContext,
} from '@nocobase/client';
import { Registry, lodash } from '@nocobase/utils/client';
import { instructions, useAvailableUpstreams, useNodeContext } from '..';
import { useFlowContext } from '../../FlowContext';
import { JOB_STATUS } from '../../constants';
import { NAMESPACE, lang } from '../../locale';
import { useTrigger } from '../../triggers';
import { useWorkflowVariableOptions } from '../../variable';
import { DetailsBlockProvider } from './DetailsBlockProvider';
import { FormBlockProvider } from './FormBlockProvider';
import createRecordForm from './forms/create';
import customRecordForm from './forms/custom';
import updateRecordForm from './forms/update';

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
    useInitializer: ({ collections }?: { collections: any[] }) => SchemaInitializerItemOptions;
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

manualFormTypes.register('customForm', customRecordForm);
manualFormTypes.register('createForm', createRecordForm);
manualFormTypes.register('updateForm', updateRecordForm);

function useTriggerInitializers(): SchemaInitializerItemOptions | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers ? trigger.useInitializers(workflow.config) : null;
}

const blockTypeNames = {
  customForm: customRecordForm.title,
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
  const { collections } = useCollectionManager();
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
      children: Array.from(manualFormTypes.getValues()).map((item: ManualFormType) => {
        const { useInitializer: getInitializer } = item.config;
        return getInitializer({ collections });
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

  return (
    <SchemaInitializer.Button
      data-testid="add-block-button-in-workflow"
      {...props}
      wrap={gridRowColWrap}
      items={items}
      title="{{t('Add block')}}"
    />
  );
}

function AssignedFieldValues() {
  const ctx = useContext(SchemaComponentContext);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const scope = useWorkflowVariableOptions({ fieldNames: { label: 'title', value: 'name' } });
  const [open, setOpen] = useState(false);
  const [initialSchema, setInitialSchema] = useState(
    fieldSchema?.['x-action-settings']?.assignedValues?.schema ?? {
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'CustomFormItemInitializers',
      properties: {},
    },
  );
  const [schema, setSchema] = useState<Schema>(null);
  const { components } = useSchemaOptionsContext();
  useEffect(() => {
    setSchema(
      new Schema({
        properties: {
          grid: initialSchema,
        },
      }),
    );
  }, [initialSchema]);
  const form = useMemo(() => {
    const initialValues = fieldSchema?.['x-action-settings']?.assignedValues?.values;
    return createForm({
      initialValues: lodash.cloneDeep(initialValues),
      values: lodash.cloneDeep(initialValues),
    });
  }, []);

  const title = t('Assign field values');

  function onCancel() {
    setOpen(false);
  }

  function onSubmit() {
    if (!fieldSchema['x-action-settings']) {
      fieldSchema['x-action-settings'] = {};
    }
    if (!fieldSchema['x-action-settings'].assignedValues) {
      fieldSchema['x-action-settings'].assignedValues = {};
    }
    fieldSchema['x-action-settings'].assignedValues.schema = initialSchema;
    fieldSchema['x-action-settings'].assignedValues.values = form.values;
    setOpen(false);
    setTimeout(() => {
      ctx.refresh?.();
    }, 300);
  }

  return (
    <>
      <SchemaSettings.Item onClick={() => setOpen(true)}>{title}</SchemaSettings.Item>
      <Modal
        width={'50%'}
        title={title}
        open={open}
        onCancel={onCancel}
        footer={
          <Space>
            <Button onClick={onCancel}>{t('Cancel')}</Button>
            <Button type="primary" onClick={onSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        }
      >
        <VariableScopeProvider scope={scope}>
          <FormProvider form={form}>
            <FormLayout layout={'vertical'}>
              <Alert
                message={lang('Values preset in this form will override user submitted ones when continue or reject.')}
              />
              <br />
              {open && schema && (
                <SchemaComponentContext.Provider
                  value={{
                    ...ctx,
                    refresh() {
                      setInitialSchema(lodash.get(schema.toJSON(), 'properties.grid'));
                    },
                  }}
                >
                  <SchemaComponent schema={schema} components={components} />
                </SchemaComponentContext.Provider>
              )}
            </FormLayout>
          </FormProvider>
        </VariableScopeProvider>
      </Modal>
    </>
  );
}

function ManualActionDesigner(props) {
  return (
    <GeneralSchemaDesigner {...props} disableInitializer>
      <Action.Designer.ButtonEditor />
      <AssignedFieldValues />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ActionBar',
        }}
      />
    </GeneralSchemaDesigner>
  );
}

function ContinueInitializer({ action, actionProps, insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
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
          'x-designer': 'ManualActionDesigner',
          'x-action-settings': {},
        });
      }}
    />
  );
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
      data-testid="configure-actions-add-action-button"
      {...props}
      items={[
        {
          key: JOB_STATUS.RESOLVED,
          type: 'item',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          component: ContinueInitializer,
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
            danger: true,
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
          const { tabs } = lodash.get(schema.toJSON(), 'properties.drawer.properties') as { tabs: ISchema };
          const forms = Array.from(manualFormTypes.getValues()).reduce(
            (result, item: ManualFormType) => Object.assign(result, item.config.parseFormOptions(tabs)),
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
          // @ts-ignore
          ...Array.from(manualFormTypes.getValues()).reduce(
            (result, item: ManualFormType) => Object.assign(result, item.config.initializers),
            {},
          ),
        }}
      >
        <SchemaComponent
          schema={schema}
          components={{
            ...nodeComponents,
            // @ts-ignore
            ...Array.from(manualFormTypes.getValues()).reduce(
              (result, item: ManualFormType) => Object.assign(result, item.config.components),
              {},
            ),
            FormBlockProvider,
            DetailsBlockProvider,
            // NOTE: fake provider component
            ManualActionStatusProvider(props) {
              return props.children;
            },
            ActionBarProvider(props) {
              return props.children;
            },
            SimpleDesigner,
            ManualActionDesigner,
          }}
          scope={{
            useSubmit,
            useDetailsBlockProps: useFormBlockContext,
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
      <Button type="primary" onClick={() => setVisible(true)}>
        {workflow.executed ? lang('View user interface') : lang('Configure user interface')}
      </Button>
      <ActionContextProvider value={{ visible, setVisible }}>{props.children}</ActionContextProvider>
    </>
  );
}
