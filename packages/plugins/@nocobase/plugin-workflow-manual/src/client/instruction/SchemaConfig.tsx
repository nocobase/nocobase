import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormProvider, ISchema, Schema, useFieldSchema, useForm } from '@formily/react';
import { Alert, Button, Modal, Space } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Action,
  ActionContextProvider,
  CompatibleSchemaInitializer,
  DefaultValueProvider,
  FormActiveFieldsProvider,
  GeneralSchemaDesigner,
  InitializerWithSwitch,
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  VariableScopeProvider,
  css,
  gridRowColWrap,
  useCompile,
  useDataSourceManager,
  useFormActiveFields,
  useFormBlockContext,
  usePlugin,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaOptionsContext,
} from '@nocobase/client';
import WorkflowPlugin, {
  JOB_STATUS,
  DetailsBlockProvider,
  SimpleDesigner,
  useAvailableUpstreams,
  useFlowContext,
  useNodeContext,
  useTrigger,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client';
import { Registry, lodash } from '@nocobase/utils/client';

import { NAMESPACE, useLang } from '../../locale';
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
    useInitializer: ({ allCollections }?: { allCollections: any[] }) => SchemaInitializerItemType;
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

function useTriggerInitializers(): SchemaInitializerItemType | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers ? trigger.useInitializers(workflow.config) : null;
}

const blockTypeNames = {
  customForm: customRecordForm.title,
  record: `{{t("Data record", { ns: "${NAMESPACE}" })}}`,
};

/**
 * @deprecated
 */
export const addBlockButton_deprecated = new CompatibleSchemaInitializer({
  name: 'AddBlockButton',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
      hideIfNoChildren: true,
      useChildren() {
        const workflowPlugin = usePlugin(WorkflowPlugin);
        const current = useNodeContext();
        const nodes = useAvailableUpstreams(current);
        const triggerInitializers = [useTriggerInitializers()].filter(Boolean);
        const nodeBlockInitializers = nodes
          .map((node) => {
            const instruction = workflowPlugin.instructions.get(node.type);
            return instruction?.useInitializers?.(node);
          })
          .filter(Boolean);
        const dataBlockInitializers: any = [
          ...triggerInitializers,
          ...(nodeBlockInitializers.length
            ? [
                {
                  name: 'nodes',
                  type: 'subMenu',
                  title: `{{t("Node result", { ns: "workflow" })}}`,
                  children: nodeBlockInitializers,
                },
              ]
            : []),
        ].filter(Boolean);
        return dataBlockInitializers;
      },
    },
    {
      type: 'itemGroup',
      name: 'form',
      title: '{{t("Form")}}',
      useChildren() {
        const dm = useDataSourceManager();
        const allCollections = dm.getAllCollections();
        return Array.from(manualFormTypes.getValues()).map((item: ManualFormType) => {
          const { useInitializer: getInitializer } = item.config;
          return getInitializer({ allCollections });
        });
      },
    },
    {
      type: 'itemGroup',
      name: 'otherBlocks',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});

export const addBlockButton = new CompatibleSchemaInitializer(
  {
    name: 'workflowManual:popup:configureUserInterface:addBlock',
    wrap: gridRowColWrap,
    title: '{{t("Add block")}}',
    items: [
      {
        type: 'itemGroup',
        name: 'dataBlocks',
        title: '{{t("Data blocks")}}',
        hideIfNoChildren: true,
        useChildren() {
          const workflowPlugin = usePlugin(WorkflowPlugin);
          const current = useNodeContext();
          const nodes = useAvailableUpstreams(current);
          const triggerInitializers = [useTriggerInitializers()].filter(Boolean);
          const nodeBlockInitializers = nodes
            .map((node) => {
              const instruction = workflowPlugin.instructions.get(node.type);
              return instruction?.useInitializers?.(node);
            })
            .filter(Boolean);
          const dataBlockInitializers: any = [
            ...triggerInitializers,
            ...(nodeBlockInitializers.length
              ? [
                  {
                    name: 'nodes',
                    type: 'subMenu',
                    title: `{{t("Node result", { ns: "${NAMESPACE}" })}}`,
                    children: nodeBlockInitializers,
                  },
                ]
              : []),
          ].filter(Boolean);
          return dataBlockInitializers;
        },
      },
      {
        type: 'itemGroup',
        name: 'form',
        title: '{{t("Form")}}',
        useChildren() {
          const dm = useDataSourceManager();
          const allCollections = dm.getAllCollections();
          return Array.from(manualFormTypes.getValues()).map((item: ManualFormType) => {
            const { useInitializer: getInitializer } = item.config;
            return getInitializer({ allCollections });
          });
        },
      },
      {
        type: 'itemGroup',
        name: 'otherBlocks',
        title: '{{t("Other blocks")}}',
        children: [
          {
            name: 'markdown',
            title: '{{t("Markdown")}}',
            Component: 'MarkdownBlockInitializer',
          },
        ],
      },
    ],
  },
  addBlockButton_deprecated,
);

function AssignedFieldValues() {
  const ctx = useContext(SchemaComponentContext);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const scope = useWorkflowVariableOptions();
  const [open, setOpen] = useState(false);
  const [initialSchema, setInitialSchema] = useState(
    fieldSchema?.['x-action-settings']?.assignedValues?.schema ?? {
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'assignFieldValuesForm:configureFields',
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
  }, [fieldSchema]);
  const upLevelActiveFields = useFormActiveFields();

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
      <SchemaSettingsItem title={title} onClick={() => setOpen(true)}>
        {title}
      </SchemaSettingsItem>
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
        <DefaultValueProvider isAllowToSetDefaultValue={() => false}>
          <VariableScopeProvider scope={scope}>
            <FormActiveFieldsProvider name="form" getActiveFieldsName={upLevelActiveFields?.getActiveFieldsName}>
              <FormProvider form={form}>
                <FormLayout layout={'vertical'}>
                  <Alert
                    message={useLang(
                      'Values preset in this form will override user submitted ones when continue or reject.',
                    )}
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
            </FormActiveFieldsProvider>
          </VariableScopeProvider>
        </DefaultValueProvider>
      </Modal>
    </>
  );
}

function ManualActionDesigner(props) {
  return (
    <GeneralSchemaDesigner {...props} disableInitializer>
      <Action.Designer.ButtonEditor />
      <AssignedFieldValues />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ActionBar',
        }}
      />
    </GeneralSchemaDesigner>
  );
}

function ContinueInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { action, actionProps, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      {...others}
      onClick={() => {
        insert({
          type: 'void',
          title: others.title,
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

function ActionInitializer() {
  const itemConfig = useSchemaInitializerItem();
  const { action, actionProps, ...others } = itemConfig;
  return (
    <InitializerWithSwitch
      {...others}
      item={itemConfig}
      schema={{
        type: 'void',
        title: others.title,
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

/**
 * @deprecated
 */
export const addActionButton_deprecated = new CompatibleSchemaInitializer({
  name: 'AddActionButton',
  title: '{{t("Configure actions")}}',
  items: [
    {
      name: 'jobStatusResolved',
      title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
      Component: ContinueInitializer,
      action: JOB_STATUS.RESOLVED,
      actionProps: {
        type: 'primary',
      },
    },
    {
      name: 'jobStatusRejected',
      title: `{{t("Terminate the process", { ns: "${NAMESPACE}" })}}`,
      Component: ActionInitializer,
      action: JOB_STATUS.REJECTED,
      actionProps: {
        danger: true,
      },
    },
    {
      name: 'jobStatusPending',
      title: `{{t("Save temporarily", { ns: "${NAMESPACE}" })}}`,
      Component: ActionInitializer,
      action: JOB_STATUS.PENDING,
    },
  ],
});

export const addActionButton = new CompatibleSchemaInitializer(
  {
    name: 'workflowManual:form:configureActions',
    title: '{{t("Configure actions")}}',
    items: [
      {
        name: 'jobStatusResolved',
        title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
        Component: ContinueInitializer,
        action: JOB_STATUS.RESOLVED,
        actionProps: {
          type: 'primary',
        },
      },
      {
        name: 'jobStatusRejected',
        title: `{{t("Terminate the process", { ns: "${NAMESPACE}" })}}`,
        Component: ActionInitializer,
        action: JOB_STATUS.REJECTED,
        actionProps: {
          danger: true,
        },
      },
      {
        name: 'jobStatusPending',
        title: `{{t("Save temporarily", { ns: "${NAMESPACE}" })}}`,
        Component: ActionInitializer,
        action: JOB_STATUS.PENDING,
      },
    ],
  },
  addActionButton_deprecated,
);

// NOTE: fake useAction for ui configuration
function useSubmit() {
  // const { values, submit, id: formId } = useForm();
  // const formSchema = useFieldSchema();
  return {
    run() {},
  };
}

export function SchemaConfig({ value, onChange }) {
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const ctx = useContext(SchemaComponentContext);
  const node = useNodeContext();
  const nodes = useAvailableUpstreams(node);
  const form = useForm();
  const { workflow } = useFlowContext();

  const nodeComponents = {};
  nodes.forEach((item) => {
    const instruction = workflowPlugin.instructions.get(item.type);
    Object.assign(nodeComponents, instruction.components);
  });

  const schema = useMemo(
    () =>
      new Schema({
        properties: {
          drawer: {
            type: 'void',
            title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'Form',
            'x-component': 'Action.Drawer',
            'x-component-props': {
              className: css`
                .ant-drawer-body {
                  background: var(--nb-box-bg);
                }
              `,
            },
            properties: {
              tabs: {
                type: 'void',
                'x-component': 'Tabs',
                'x-component-props': {},
                'x-initializer': 'TabPaneInitializers',
                'x-initializer-props': {
                  gridInitializer: 'workflowManual:popup:configureUserInterface:addBlock',
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
                        'x-initializer': 'workflowManual:popup:configureUserInterface:addBlock',
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

  const refresh = useCallback(
    function refresh() {
      // ctx.refresh?.();
      const { tabs } = lodash.get(schema.toJSON(), 'properties.drawer.properties') as { tabs: ISchema };
      const forms = Array.from(manualFormTypes.getValues()).reduce(
        (result, item: ManualFormType) => Object.assign(result, item.config.parseFormOptions(tabs)),
        {},
      );
      form.setValuesIn('forms', forms);

      onChange(tabs.properties);
    },
    [form, onChange, schema],
  );

  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        designable: !workflow.executed,
        refresh,
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
    </SchemaComponentContext.Provider>
  );
}

export function SchemaConfigButton(props) {
  const { workflow } = useFlowContext();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)} disabled={false}>
        {useLang(workflow.executed ? 'View user interface' : 'Configure user interface')}
      </Button>
      <ActionContextProvider value={{ visible, setVisible, formValueChanged: false }}>
        {props.children}
      </ActionContextProvider>
    </>
  );
}
