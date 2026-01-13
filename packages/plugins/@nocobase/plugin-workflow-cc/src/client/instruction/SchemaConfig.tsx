/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { uid } from '@formily/shared';
import { ISchema, observer, useForm } from '@formily/react';
import { Button, Dropdown, Modal, Spin, Typography } from 'antd';

import {
  ActionContextProvider,
  css,
  gridRowColWrap,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemType,
  parseCollectionName,
  useActionContext,
  useAPIClient,
  usePlugin,
  useRequest,
  useSchemaOptionsContext,
} from '@nocobase/client';
import PluginWorkflowClient, {
  SimpleDesigner,
  useAvailableUpstreams,
  useFlowContext,
  useNodeContext,
  useTrigger,
  useWorkflowExecuted,
} from '@nocobase/plugin-workflow/client';
import {
  FlowModel,
  FlowModelRenderer,
  useFlowEngine,
  useFlowEngineContext,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { DeleteOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import { NAMESPACE } from '../../common/constants';
import { lang, usePluginTranslation } from '../locale';

const ConfigChangedContext = React.createContext<any>({});

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

function CcFlowModelConfigContent({ form, valueKey, modelUse, stepParams }) {
  const flowEngine = useFlowEngine();
  const viewCtx = useFlowViewContext();
  const { data: model, loading } = useRequest(
    async () => {
      const model: FlowModel = await flowEngine.loadOrCreateModel({
        async: true,
        uid: form.values[valueKey],
        subType: 'object',
        use: modelUse,
        stepParams,
      });

      if (model?.uid) {
        model.context.addDelegate(viewCtx);
        model.context.defineProperty('flowSettingsEnabled', {
          get: () => !form.disabled,
        });
        form.setValuesIn(valueKey, model.uid);
      }

      return model;
    },
    {
      refreshDeps: [form.values[valueKey], form.disabled],
    },
  );

  if (loading) {
    return <Spin />;
  }

  return <FlowModelRenderer model={model as FlowModel} hideRemoveInSettings showFlowSettings={false} />;
}

function CcFlowModelConfigButton({ valueKey, modelUse, title, stepParams }) {
  const { setFormValueChanged } = useActionContext();
  const ctx = useFlowEngineContext();
  const { t, viewer, themeToken } = ctx;
  const form = useForm();
  const flowContext = useFlowContext();
  const [dataSourceName, collectionName] = flowContext?.workflow?.config?.collection
    ? parseCollectionName(flowContext.workflow.config.collection)
    : [null, null];

  const open = () => {
    viewer.open({
      type: 'dialog',
      width: 800,
      closable: true,
      title: t(title, { ns: NAMESPACE }),
      inputArgs: {
        flowContext,
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
        <CcFlowModelConfigContent
          form={form}
          valueKey={valueKey}
          modelUse={modelUse}
          stepParams={
            stepParams || {
              CcChildPageSettings: {
                init: {
                  dataSourceKey: dataSourceName,
                  collectionName,
                },
              },
            }
          }
        />
      ),
    });
    if (!form.values[valueKey]) {
      setFormValueChanged?.(true);
    }
  };

  return (
    <Button type="primary" onClick={open} disabled={false} icon={<SettingOutlined />}>
      {t(title, { ns: NAMESPACE })}
    </Button>
  );
}

export function CcTaskCardConfigButton() {
  const flowContext = useFlowContext();
  const [dataSourceName, collectionName] = flowContext?.workflow?.config?.collection
    ? parseCollectionName(flowContext.workflow.config.collection)
    : [null, null];
  return (
    <CcFlowModelConfigButton
      valueKey="taskCardUid"
      modelUse="CcTaskCardDetailsModel"
      title="Task card"
      stepParams={{
        cardSettings: {
          titleDescription: {
            title: flowContext.workflow?.title,
          },
        },
        detailsSettings: {
          refresh: {},
          layout: {},
        },
        CcChildPageSettings: {
          init: {
            dataSourceKey: dataSourceName,
            collectionName,
          },
        },
      }}
    />
  );
}

export function CcInterfaceConfig() {
  const form = useForm();
  const ctx = useFlowEngineContext();
  const flowContext = useFlowContext();
  const { setFormValueChanged } = useActionContext();
  const [v1Visible, setV1Visible] = useState(false);
  const { t, viewer, themeToken } = ctx;
  const api = useAPIClient();
  const [dataSourceName, collectionName] = parseCollectionName(flowContext.workflow.config.collection);

  const openV2 = ({ needConfirm } = {} as any) => {
    const doOpen = () => {
      viewer.open({
        type: 'dialog',
        width: 800,
        closable: true,
        title: t('User interface', { ns: NAMESPACE }),
        inputArgs: {
          flowContext,
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
          <CcFlowModelConfigContent
            form={form}
            valueKey="ccUid"
            modelUse="CcChildPageModel"
            stepParams={{
              CcChildPageSettings: {
                init: {
                  dataSourceKey: dataSourceName,
                  collectionName,
                },
              },
            }}
          />
        ),
      });
      if (!form.values.ccUid) {
        setFormValueChanged?.(true);
      }
    };

    if (form.values.ccDetail && needConfirm) {
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
      if (form.values.ccDetail) {
        await api.request({ url: `uiSchemas:remove/${form.values.ccDetail}`, method: 'POST' });
      }
      form.setValuesIn('ccDetail', null);
      setFormValueChanged?.(true);
    } catch (err) {
      console.error('Failed to delete v1 configuration:', err);
    }
  };

  const items = [
    {
      key: 'v1',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 120 }}>
          <span style={{ flex: 1 }}>{lang('v1 (Legacy)')}</span>
          {form.values.ccDetail && (
            <DeleteOutlined
              onClick={(e) => {
                e.stopPropagation();
                Modal.confirm({
                  title: t('Delete v1 configuration', { ns: NAMESPACE }),
                  onOk: deleteV1,
                });
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

  if (form.values.ccDetail) {
    return (
      <ConfigChangedContext.Provider value={{ setFormValueChanged }}>
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
    <Button icon={<SettingOutlined />} type="primary" onClick={() => openV2({ needConfirm: false })} disabled={false}>
      {lang('Go to configure')}
    </Button>
  );
}

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
