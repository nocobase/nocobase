/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreditCardOutlined, DeleteOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import {
  FlowModelRenderer,
  randomId,
  useFlowContext as useFlowEngineContext,
  useFlowEngine,
  type CreateModelOptions,
  type FlowModel,
} from '@nocobase/flow-engine';
import {
  parseCollectionName,
  useAvailableUpstreams,
  useCurrentWorkflowContext,
  useFlowContext as useWorkflowCanvasContext,
  useNodeContext,
} from '@nocobase/plugin-workflow/client-v2';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Dropdown, Form, Modal, Space, Spin, theme, type MenuProps } from 'antd';
import React, { useEffect, useMemo } from 'react';

import { useTempAssociationSources } from '../hooks/useTempAssociationSources';
import { useT } from '../locale';
import { registerWorkflowCcModelLoaders } from '../models/registerModelLoaders';
import {
  updateWorkflowCcTaskAssociationFields,
  type CCTaskTempAssociationFieldConfig,
} from '../models/CCTaskCardDetailsItemModel';
import { registerWorkflowCcCollections } from '../utils/registerWorkflowCcCollections';

export type FlowModelConfigKind = 'interface' | 'taskCard';

export interface FlowModelConfigInputProps {
  configKey: string;
  disabled?: boolean;
  kind: FlowModelConfigKind;
  legacyConfigKey?: string;
  onChange?: (value: string) => void;
  value?: string;
}

type WorkflowLike = {
  config?: {
    collection?: string;
  };
  id?: number | string;
  title?: string;
  type?: string;
};

type NodeLike = {
  config?: Record<string, unknown>;
  id?: number | string;
  key?: string;
  type?: string;
};

type ChildPageModelLike = FlowModel & {
  addSubModel?: (subKey: string, options: CreateModelOptions) => FlowModel;
  save?: () => Promise<void>;
  setStepParams?: (flowKey: string, stepKey: string, params: Record<string, unknown>) => void;
  subModels?: {
    tabs?: Array<TabModelLike>;
  };
};

type TabModelLike = FlowModel & {
  addSubModel?: (subKey: string, options: CreateModelOptions) => FlowModel;
  hasSubModel?: (subKey: string) => boolean;
  save?: () => Promise<void>;
  setSubModel?: (subKey: string, options: CreateModelOptions) => FlowModel;
  subModels?: {
    grid?: FlowModel;
  };
};

type TaskCardModelLike = FlowModel & {
  addSubModel?: (subKey: string, options: CreateModelOptions) => FlowModel;
  save?: () => Promise<void>;
  subModels?: {
    grid?: FlowModel;
  };
};

type FlowEngineWithPluginManager = ReturnType<typeof useFlowEngine> & {
  context?: {
    app?: {
      pm?: {
        get?: (name: string) => unknown;
      };
    };
  };
};

function parseWorkflowCollection(collection?: string): [string, string] {
  if (!collection) {
    return ['main', 'users'];
  }
  const parsed = parseCollectionName(collection) as [string, string];
  if (parsed?.[0] && parsed?.[1]) {
    return parsed;
  }
  return ['main', collection];
}

function getExpectedModelUse(options: CreateModelOptions) {
  return typeof options.use === 'string' ? options.use : options.use?.name;
}

function getModelUseName(model?: FlowModel | null) {
  const modelUse = model?.use;
  return typeof modelUse === 'string' ? modelUse : modelUse?.name;
}

function createCCGridModelOptions(): CreateModelOptions {
  return {
    async: true,
    subType: 'object',
    use: 'CCBlockGridModel',
  };
}

function createCCTabModelOptions(): CreateModelOptions {
  return {
    use: 'CCChildPageTabModel',
    stepParams: {
      pageTabSettings: {
        tab: {
          title: '{{t("Details")}}',
        },
      },
    },
    subModels: {
      grid: createCCGridModelOptions(),
    },
  };
}

function createCCInterfaceModelOptions(uid: string, workflow: WorkflowLike): CreateModelOptions {
  const [dataSourceKey, collectionName] = parseWorkflowCollection(workflow?.config?.collection);
  return {
    async: true,
    subType: 'object',
    uid,
    use: 'CCChildPageModel',
    props: {
      displayTitle: false,
      enableTabs: false,
      title: '{{t("User interface", { ns: "@nocobase/plugin-workflow-cc" })}}',
    },
    subModels: {
      tabs: [createCCTabModelOptions()],
    },
    stepParams: {
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: false,
          title: '{{t("User interface", { ns: "@nocobase/plugin-workflow-cc" })}}',
        },
      },
      CCChildPageSettings: {
        init: {
          collectionName,
          dataSourceKey,
        },
      },
    },
  };
}

function createTaskCardModelOptions(uid: string): CreateModelOptions {
  return {
    async: true,
    subType: 'object',
    uid,
    use: 'CCTaskCardDetailsModel',
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
    subModels: {
      grid: {
        subType: 'object',
        use: 'CCTaskCardGridModel',
      },
    },
  };
}

async function loadExpectedModel({
  createModelOptions,
  flowEngine,
  onChange,
  uid,
  uidPrefix,
}: {
  createModelOptions: (uid: string) => CreateModelOptions;
  flowEngine: ReturnType<typeof useFlowEngine>;
  onChange?: (value: string) => void;
  uid: string;
  uidPrefix: string;
}) {
  const options = createModelOptions(uid);
  const expectedUse = getExpectedModelUse(options);
  const loadedModel = (await flowEngine.loadOrCreateModel(options)) as FlowModel | null;
  if (!loadedModel?.uid || !expectedUse || getModelUseName(loadedModel) === expectedUse) {
    return loadedModel;
  }

  flowEngine.removeModelWithSubModels?.(loadedModel.uid);
  const nextUid = randomId(uidPrefix);
  onChange?.(nextUid);
  return (await flowEngine.loadOrCreateModel(createModelOptions(nextUid))) as FlowModel | null;
}

async function ensureCCInterfaceStructure(model: FlowModel) {
  const childPageModel = model as ChildPageModelLike;
  let changed = false;
  let tab = childPageModel.subModels?.tabs?.[0];

  if (!tab?.uid && childPageModel.addSubModel) {
    tab = childPageModel.addSubModel('tabs', createCCTabModelOptions()) as TabModelLike;
    changed = true;
  }

  if (tab?.uid && !tab.subModels?.grid) {
    if (tab.setSubModel) {
      tab.setSubModel('grid', createCCGridModelOptions());
      changed = true;
    } else if (tab.addSubModel) {
      tab.addSubModel('grid', createCCGridModelOptions());
      changed = true;
    }
  }

  if (changed) {
    await childPageModel.save?.();
  }
}

async function ensureTaskCardStructure(model: FlowModel) {
  const taskCardModel = model as TaskCardModelLike;
  if (taskCardModel.subModels?.grid || !taskCardModel.addSubModel) {
    return;
  }

  taskCardModel.addSubModel('grid', {
    subType: 'object',
    use: 'CCTaskCardGridModel',
  });
  await taskCardModel.save?.();
}

async function ensureTaskCardFieldMenuModels(flowEngine: ReturnType<typeof useFlowEngine>) {
  const modelNames = [
    'CCTaskCardDetailsItemModel',
    'CCTaskCardDetailsAssociationFieldGroupModel',
    'TaskCardCommonItemModel',
  ];
  const pluginManager = (flowEngine as FlowEngineWithPluginManager).context?.app?.pm;
  const hasUiTemplatesPlugin =
    !!pluginManager?.get?.('ui-templates') || !!pluginManager?.get?.('@nocobase/plugin-ui-templates');
  if (hasUiTemplatesPlugin) {
    modelNames.push('SubModelTemplateImporterModel');
  }

  await Promise.all(modelNames.map((modelName) => flowEngine.getModelClassAsync?.(modelName)));
}

function FlowModelConfigDialogContent({
  disabled,
  kind,
  node,
  nodes,
  onChange,
  uid,
  uidPrefix,
  upstreams,
  workflow,
}: {
  disabled?: boolean;
  kind: FlowModelConfigKind;
  node: NodeLike;
  nodes?: NodeLike[];
  onChange?: (value: string) => void;
  uid: string;
  uidPrefix: string;
  upstreams?: NodeLike[];
  workflow: WorkflowLike;
}) {
  const flowEngine = useFlowEngine();
  const { token } = theme.useToken();
  const createModelOptions = useMemoizedFn((modelUid: string) => {
    return kind === 'interface'
      ? createCCInterfaceModelOptions(modelUid, workflow)
      : createTaskCardModelOptions(modelUid);
  });
  const tempAssociationSources = useTempAssociationSources(workflow, upstreams || []);
  const tempAssociationSourceSignature = useMemo(
    () => tempAssociationSources.map((item) => `${item.nodeType}:${item.nodeKey}`).join('|'),
    [tempAssociationSources],
  );
  const syncTempAssociationFields = useMemoizedFn((fields: CCTaskTempAssociationFieldConfig[]) => {
    const nodeConfig = node.config || {};
    if (disabled || nodeConfig.tempAssociationFields === fields) {
      return;
    }
    node.config = {
      ...nodeConfig,
      tempAssociationFields: fields,
    };
  });
  const { data: model, loading } = useRequest(
    async () => {
      registerWorkflowCcModelLoaders(flowEngine);
      registerWorkflowCcCollections(flowEngine);
      const nextModel = await loadExpectedModel({ createModelOptions, flowEngine, onChange, uid, uidPrefix });
      if (!nextModel) {
        return null;
      }
      if (kind === 'interface') {
        await ensureCCInterfaceStructure(nextModel);
      } else {
        await ensureTaskCardStructure(nextModel);
        await ensureTaskCardFieldMenuModels(flowEngine);
        updateWorkflowCcTaskAssociationFields({
          flowEngine,
          workflow,
          nodes: upstreams,
          tempAssociationSources,
        });
      }
      nextModel.context.defineProperty('flowSettingsEnabled', {
        get: () => !disabled,
        cache: false,
      });
      nextModel.context.defineProperty('view', {
        value: {
          inputArgs: {
            flowContext: {
              workflow,
              nodes: nodes?.length ? nodes : [node],
            },
            availableUpstreams: upstreams || [],
            node,
            nodeConfig: node?.config || {},
          },
        },
      });
      nextModel.context.defineProperty('workflow', {
        get: () => workflow,
        cache: false,
      });
      nextModel.context.defineProperty('nodes', {
        get: () => nodes || [],
        cache: false,
      });
      nextModel.context.defineProperty('tempAssociationSources', {
        get: () => tempAssociationSources,
        cache: false,
      });
      nextModel.context.defineProperty('ccTaskTempAssociationSync', {
        get: () => syncTempAssociationFields,
        cache: false,
      });
      return nextModel;
    },
    {
      refreshDeps: [
        uid,
        disabled,
        kind,
        workflow?.config?.collection,
        node?.key,
        nodes?.length,
        tempAssociationSourceSignature,
      ],
    },
  );

  useEffect(() => {
    if (kind !== 'taskCard') {
      return;
    }
    updateWorkflowCcTaskAssociationFields({
      flowEngine,
      workflow,
      nodes: upstreams,
      tempAssociationSources,
    });
  }, [flowEngine, kind, tempAssociationSources, tempAssociationSourceSignature, upstreams, workflow]);

  if (loading || !model?.uid) {
    return <Spin style={{ display: 'block', margin: token.marginLG }} />;
  }

  return <FlowModelRenderer model={model} hideRemoveInSettings showFlowSettings={kind === 'taskCard'} />;
}

export function FlowModelConfigInput({
  configKey,
  disabled,
  kind,
  legacyConfigKey,
  onChange,
  value,
}: FlowModelConfigInputProps) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance();
  const workflow = useCurrentWorkflowContext() as WorkflowLike;
  const node = useNodeContext() as NodeLike;
  const canvasContext = useWorkflowCanvasContext() as { nodes?: NodeLike[]; refresh?: () => void };
  const upstreams = useAvailableUpstreams(node) as NodeLike[];
  const legacyConfigValue = Form.useWatch(['config', legacyConfigKey || '__workflowCcLegacyConfig__'], form);
  const currentLegacyConfigValue =
    legacyConfigValue ?? (legacyConfigKey ? form.getFieldValue(['config', legacyConfigKey]) : undefined);
  const title = kind === 'interface' ? t('User interface') : t('Task card');
  const uidPrefix = kind === 'interface' ? 'cc_interface_' : 'cc_task_card_';
  const openConfig = useMemoizedFn(() => {
    const uid = value || randomId(uidPrefix);
    if (!value) {
      onChange?.(uid);
    }

    ctx.viewer.dialog({
      width: token.screenMD + token.paddingMD * 2,
      closable: true,
      title,
      styles: {
        body: {
          padding: token.paddingLG,
          backgroundColor: 'var(--nb-box-bg)',
        },
        content: {
          padding: 0,
        },
      },
      content: () => (
        <FlowModelConfigDialogContent
          disabled={disabled}
          kind={kind}
          node={node}
          nodes={canvasContext?.nodes}
          onChange={onChange}
          uid={uid}
          uidPrefix={uidPrefix}
          upstreams={upstreams}
          workflow={workflow}
        />
      ),
    });
  });

  const deleteLegacyConfig = useMemoizedFn(async () => {
    if (!legacyConfigKey || !currentLegacyConfigValue) {
      return;
    }
    await ctx.api.request({ method: 'POST', url: `uiSchemas:remove/${currentLegacyConfigValue}` });
    form.setFieldValue(['config', legacyConfigKey], null);
    canvasContext?.refresh?.();
    ctx.message?.success?.(t('Deleted successfully'));
  });

  const openDeleteLegacyConfirm = useMemoizedFn((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    Modal.confirm({
      title: t('Delete v1 configuration'),
      onOk: deleteLegacyConfig,
    });
  });

  const legacyMenuItems: MenuProps['items'] = [
    {
      key: 'v1',
      label: (
        <Space>
          <span>{t('v1 (Legacy)')}</span>
          <DeleteOutlined onClick={openDeleteLegacyConfirm} />
        </Space>
      ),
    },
    {
      key: 'v2',
      label: t('v2'),
      onClick: openConfig,
    },
  ];
  const icon = kind === 'interface' ? <SettingOutlined aria-hidden /> : <CreditCardOutlined aria-hidden />;
  const buttonType = kind === 'interface' ? 'primary' : 'default';

  if (kind === 'interface' && currentLegacyConfigValue) {
    return (
      <Dropdown menu={{ items: legacyMenuItems }} trigger={['hover']}>
        <Button disabled={disabled} icon={icon} type={buttonType}>
          {t('Go to configure')} <DownOutlined aria-hidden />
        </Button>
      </Dropdown>
    );
  }

  return (
    <Button disabled={disabled} icon={icon} onClick={openConfig} type={buttonType}>
      {t('Go to configure')}
    </Button>
  );
}

export default FlowModelConfigInput;
