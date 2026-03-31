/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { ISchema, observer, useField, useForm } from '@formily/react';
import { Button, Dropdown, Modal, Spin, Typography } from 'antd';
import { CreditCardOutlined, DeleteOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import isEqual from 'lodash/isEqual';

import {
  ActionContextProvider,
  css,
  gridRowColWrap,
  parseCollectionName,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemType,
  useActionContext,
  useAPIClient,
  usePlugin,
  useRequest,
  useSchemaOptionsContext,
} from '@nocobase/client';
import PluginWorkflowClient, {
  SimpleDesigner,
  updateNodeConfig,
  useAvailableUpstreams,
  useFlowContext,
  useNodeContext,
  useTrigger,
  useWorkflowExecuted,
} from '@nocobase/plugin-workflow/client';
import { useTempAssociationSources } from '../hooks/useTempAssociationSources';
import {
  FlowModel,
  FlowModelRenderer,
  useFlowEngine,
  useFlowEngineContext,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { NAMESPACE } from '../../common/constants';
import { lang, usePluginTranslation } from '../locale';
import {
  updateWorkflowCcTaskAssociationFields,
  type CCTaskTempAssociationFieldConfig,
} from '../models/CCTaskCardDetailsItemModel';
import { TEMP_ASSOCIATION_PREFIX } from '../../common/tempAssociation';

function useTriggerInitializers(): SchemaInitializerItemType | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers ? trigger.useInitializers(workflow.config) : null;
}

export const addBlockButton = new SchemaInitializer({
  name: 'workflowCc:popup:configureUserInterface:addBlock',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
      hideIfNoChildren: true,
      useChildren() {
        const workflowPlugin = usePlugin(PluginWorkflowClient);
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

function SchemaContent({ value, onChange }) {
  const api = useAPIClient();
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { components, scope } = useSchemaOptionsContext();
  const executed = useWorkflowExecuted();
  const node = useNodeContext();
  const nodes = useAvailableUpstreams(node);
  const { workflow } = useFlowContext();
  const tempAssociationSources = useTempAssociationSources(workflow, nodes);

  const { data, loading } = useRequest(
    async () => {
      if (value) {
        const { data } = await api.request({ url: `uiSchemas:getJsonSchema/${value}` });
        if (data.data?.['x-uid'] === value) {
          return data.data;
        }
      }

      const id = value ?? uid();
      // const content = createEditFormBlockUISchema();
      const newSchema = {
        type: 'void',
        name: id,
        'x-uid': id,
        'x-component': 'Grid',
        'x-initializer': 'workflowCc:popup:configureUserInterface:addBlock',
        properties: {
          [uid()]: {
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              [uid()]: {
                type: 'void',
                'x-component': 'Grid.Col',
                'x-component-props': {
                  span: 24,
                },
                properties: {
                  // [uid()]: content,
                },
              },
            },
          },
        },
      };
      await api.resource('uiSchemas').insert({
        values: newSchema,
      });
      onChange(id);
      return newSchema;
    },
    {
      refreshDeps: [value],
    },
  );

  if (loading) {
    return <Spin />;
  }

  const nodeComponents = {};
  nodes.forEach((item) => {
    const instruction = workflowPlugin.instructions.get(item.type);
    Object.assign(nodeComponents, instruction.components);
  });

  return (
    <SchemaComponentProvider scope={scope} components={components} designable={!executed}>
      <SchemaComponent
        scope={{
          useReadAction() {
            return { run() {} };
          },
          tempAssociationSources,
        }}
        components={{
          SimpleDesigner,
          ...nodeComponents,
        }}
        schema={data as ISchema}
      />
    </SchemaComponentProvider>
  );
}

export function SchemaConfig() {
  return (
    <SchemaComponent
      components={{
        SchemaContent,
      }}
      schema={
        {
          name: 'drawer',
          type: 'void',
          title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Action.Container',
          'x-component-props': {
            className: css`
              .ant-drawer-body {
                background: var(--nb-box-bg);
              }
            `,
          },
          properties: {
            ccDetail: {
              type: 'string',
              'x-component': 'SchemaContent',
            },
          },
        } as ISchema
      }
    />
  );
}

const ConfigChangedContext = React.createContext<any>({});

const ForceReadHint = observer(() => {
  const { initialValues, values } = useForm();

  return initialValues.forceRead != values.forceRead ? (
    <Typography.Paragraph type="secondary">
      <Typography.Text type="warning">{lang('Force read changes unsaved, click "Submit" to save.')}</Typography.Text>
    </Typography.Paragraph>
  ) : null;
});

export function SchemaConfigButton(props) {
  const executed = useWorkflowExecuted();
  const { setFormValueChanged } = useActionContext();
  const [visible, setVisible] = useState(false);
  const { t } = usePluginTranslation();
  return (
    <ConfigChangedContext.Provider value={{ setFormValueChanged }}>
      <Button type="primary" onClick={() => setVisible(true)} disabled={false}>
        {t(executed ? 'View user interface' : 'Configure user interface')}
      </Button>
      <ActionContextProvider value={{ visible, setVisible, formValueChanged: false }}>
        {props.children}
      </ActionContextProvider>
      <ForceReadHint />
    </ConfigChangedContext.Provider>
  );
}

// V2: CC Interface Drawer Content
function CCInterfaceDrawerContent({ form, dataSourceKey, collectionName }) {
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const { data: model, loading } = useRequest(
    async () => {
      const model: FlowModel = await flowEngine.loadOrCreateModel({
        async: true,
        uid: form.values.ccUid,
        subType: 'object',
        use: 'CCChildPageModel',
        subModels: {
          tabs: [
            {
              use: 'CCChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: `{{t("Details")}}`,
                  },
                },
              },
            },
          ],
        },
        stepParams: {
          pageSettings: {
            general: {
              displayTitle: false,
              enableTabs: false,
              title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
            },
          },
          CCChildPageSettings: {
            init: {
              dataSourceKey,
              collectionName,
            },
          },
        },
      });

      if (model?.uid) {
        model.context.addDelegate(viewCtx);
        model.context.defineProperty('flowSettingsEnabled', {
          get: () => !form.disabled,
        });
        form.setValuesIn('ccUid', model.uid);
      }

      return model;
    },
    {
      refreshDeps: [form.values.ccUid, form.disabled],
    },
  );

  if (loading) {
    return <Spin />;
  }

  return <FlowModelRenderer model={model as FlowModel} hideRemoveInSettings showFlowSettings={false} />;
}

// V2: CC Interface Config Button
export function CCInterfaceConfig({ children }) {
  const form = useForm();
  const ctx = useFlowEngineContext();
  const flowContext = useFlowContext();
  const current = useNodeContext();
  const trigger = useTrigger();
  const availableUpstreams = useAvailableUpstreams(current);
  const [v1Visible, setV1Visible] = useState(false);
  const { setFormValueChanged } = useActionContext();
  const configChangedValue = useMemo(() => ({ setFormValueChanged }), [setFormValueChanged]);
  const api = useAPIClient();
  const themeToken = ctx.themeToken;
  const t = ctx.t;

  const ccDetailValue = form.values.ccDetail;
  const ccUid = form.values.ccUid;
  const [dataSourceName, collectionName] = parseCollectionName(flowContext.workflow.config.collection);

  const openV2 = ({ needConfirm } = {} as any) => {
    const doOpen = () => {
      ctx.viewer.open({
        type: 'dialog',
        width: 800,
        closable: true,
        title: t('User interface', { ns: NAMESPACE }),
        inputArgs: {
          flowContext,
          availableUpstreams,
          trigger,
          node: current,
          nodeConfig: form.values,
        },
        styles: {
          body: {
            padding: 0,
            backgroundColor: 'var(--nb-box-bg)',
          },
          content: {
            padding: 0,
          },
          header: {
            padding: `${themeToken.padding}px ${themeToken.paddingLG}px`,
            marginBottom: 0,
          },
        },
        content: (
          <CCInterfaceDrawerContent form={form} dataSourceKey={dataSourceName} collectionName={collectionName} />
        ),
      });
      if (!form.values.ccUid) {
        setFormValueChanged?.(true);
      }
    };

    if (!ccUid && needConfirm) {
      Modal.confirm({
        title: t('Configure v2 UI', { ns: NAMESPACE }),
        content: t(
          'Before using the v2 UI, you must delete the existing v1 UI. Are you sure you want to delete the v1 UI?',
          { ns: NAMESPACE },
        ),
        onOk: async () => {
          await deleteV1();
          doOpen();
        },
      });
      return;
    }

    doOpen();
  };

  const deleteV1 = async () => {
    try {
      if (ccDetailValue) {
        await api.request({ url: `uiSchemas:remove/${ccDetailValue}`, method: 'POST' });
      }
      form.setValuesIn('ccDetail', null);
      if (setFormValueChanged) setFormValueChanged(true);
      await updateNodeConfig({
        api,
        nodeId: current.id,
        config: form.values,
      });
      ctx.message.success(t('Deleted successfully', { ns: NAMESPACE }));
    } catch (err) {
      console.error(`Failed to delete v1 configuration:`, err);
    }
  };

  const handleDeleteV1 = async (e) => {
    if (e?.domEvent) {
      e.domEvent.stopPropagation();
    } else if (e?.stopPropagation) {
      e.stopPropagation();
    }
    Modal.confirm({
      title: t('Delete v1 configuration', { ns: NAMESPACE }),
      onOk: deleteV1,
    });
  };

  const items = [
    {
      key: 'v1',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 120 }}>
          <span style={{ flex: 1 }}>{lang('v1 (Legacy)')}</span>
          {ccDetailValue && (
            <DeleteOutlined
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteV1(e);
              }}
              style={{ color: '#999', marginLeft: 8 }}
            />
          )}
        </div>
      ),
      onClick: () => setV1Visible(true),
    },
    {
      key: 'v2',
      label: lang('v2'),
      onClick: () => openV2({ needConfirm: true }),
    },
  ];

  if (ccDetailValue) {
    return (
      <ConfigChangedContext.Provider value={configChangedValue}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Dropdown menu={{ items }} trigger={['hover']}>
            <Button type="primary" icon={<SettingOutlined />}>
              {lang('Go to configure')} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <ActionContextProvider value={{ visible: v1Visible, setVisible: setV1Visible, formValueChanged: false }}>
          <SchemaConfig />
        </ActionContextProvider>
      </ConfigChangedContext.Provider>
    );
  }

  return (
    <Button icon={<SettingOutlined />} type="primary" onClick={openV2} disabled={false}>
      {lang('Go to configure')}
    </Button>
  );
}

// V2: Task Card Drawer Content
function CCTaskCardDrawerContent({ uid, onUidChange, formDisabled, workflow, nodes, form, node, setFormValueChanged }) {
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const api = useAPIClient();
  const tempAssociationSources = useTempAssociationSources(workflow, nodes);
  const workflowId = workflow?.id;
  const nodesSignature = useMemo(
    () =>
      nodes
        ?.map((item) => item?.id)
        .filter(Boolean)
        .join('|') ?? '',
    [nodes],
  );
  const syncTempAssociationFields = useCallback(
    (fields: CCTaskTempAssociationFieldConfig[]) => {
      if (formDisabled || !form || !node) return;
      if (isEqual(form.values.tempAssociationFields, fields)) return;
      form.setValuesIn('tempAssociationFields', fields);
      setFormValueChanged?.(true);
      updateNodeConfig({
        api,
        nodeId: node.id,
        config: {
          ...form.values,
          tempAssociationFields: fields,
        },
      });
    },
    [api, form, formDisabled, node, setFormValueChanged],
  );
  const { data: model, loading } = useRequest(
    async () => {
      const model: FlowModel = await flowEngine.loadOrCreateModel({
        async: true,
        uid,
        subType: 'object',
        use: 'CCTaskCardDetailsModel',
        subModels: {
          grid: {
            use: 'CCTaskCardGridModel',
            subType: 'object',
          },
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'workflowCcTasks',
            },
          },
          detailsSettings: {
            layout: {
              layout: 'horizontal',
            },
          },
        },
      });

      if (model?.uid) {
        if (viewCtx) {
          model.context.addDelegate(viewCtx);
        }
        model.context.defineProperty('flowSettingsEnabled', {
          get: () => !formDisabled,
        });
        model.context.defineProperty('workflow', {
          get: () => workflow,
          cache: false,
        });
        model.context.defineProperty('nodes', {
          get: () => nodes ?? [],
          cache: false,
        });
        model.context.defineProperty('tempAssociationSources', {
          get: () => tempAssociationSources,
          cache: false,
        });
        model.context.defineProperty('ccTaskTempAssociationSync', {
          get: () => syncTempAssociationFields,
          cache: false,
        });
        if (!uid) {
          onUidChange?.(model.uid);
        }
      }

      return model;
    },
    {
      refreshDeps: [uid, formDisabled, syncTempAssociationFields, workflowId, nodesSignature],
    },
  );

  useEffect(() => {
    updateWorkflowCcTaskAssociationFields({
      flowEngine,
      workflow,
      nodes,
      tempAssociationSources,
    });
  }, [flowEngine, nodes, workflow, tempAssociationSources]);

  if (loading) {
    return <Spin />;
  }

  return (
    <FlowModelRenderer
      model={model as FlowModel}
      hideRemoveInSettings
      showFlowSettings={
        formDisabled
          ? false
          : {
              showBackground: false,
              showBorder: true,
              showDragHandle: false,
            }
      }
    />
  );
}

// V2: Task Card Config Button
export function CCTaskCardConfigButton() {
  const form = useForm();
  const ctx = useFlowEngineContext();
  const flowContext = useFlowContext();
  const node = useNodeContext();
  const upstreamNodes = useAvailableUpstreams(node);
  const { setFormValueChanged } = useActionContext();
  const t = ctx.t;

  const onUidChange = useCallback(
    (uid: string) => {
      form.setValuesIn('taskCardUid', uid);
      setFormValueChanged?.(true);
    },
    [form, setFormValueChanged],
  );

  const cleanupTempAssociationFields = useCallback(() => {
    const collection = ctx.dataSourceManager?.getCollection('main', 'workflowCcTasks');
    if (!collection) return;
    collection
      .getFields()
      .filter((field) => field.name?.startsWith(TEMP_ASSOCIATION_PREFIX))
      .forEach((field) => {
        collection.removeField(field.name);
      });
  }, [ctx.dataSourceManager]);

  const openConfig = useCallback(() => {
    cleanupTempAssociationFields();
    ctx.viewer.open({
      type: 'dialog',
      width: 800,
      closable: true,
      title: t('Task card', { ns: NAMESPACE }),
      styles: {
        body: {
          padding: 0,
          backgroundColor: 'var(--nb-box-bg)',
        },
      },
      content: (
        <CCTaskCardDrawerContent
          uid={form.values.taskCardUid}
          onUidChange={onUidChange}
          formDisabled={form.disabled}
          workflow={flowContext.workflow}
          nodes={upstreamNodes}
          form={form}
          node={node}
          setFormValueChanged={setFormValueChanged}
        />
      ),
    });
  }, [
    cleanupTempAssociationFields,
    ctx.viewer,
    flowContext.workflow,
    form,
    node,
    onUidChange,
    setFormValueChanged,
    t,
    upstreamNodes,
  ]);

  return (
    <Button icon={<CreditCardOutlined />} type="default" onClick={openConfig} disabled={false}>
      {lang('Go to configure')}
    </Button>
  );
}
