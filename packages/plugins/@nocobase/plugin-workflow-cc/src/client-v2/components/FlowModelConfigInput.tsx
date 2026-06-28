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
import { Button, Dropdown, Form, Modal, Space, Spin, theme, type FormInstance, type MenuProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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

const FLOW_MODEL_CONFIG_KEYS = ['ccUid', 'taskCardUid'];
const GENERATED_CONFIG_KEYS = ['tempAssociationFields'];
type PersistedConfigResult = Record<string, unknown> | false | null;

const nodeConfigPersistQueues = new Map<number | string, Promise<PersistedConfigResult>>();
const formPendingGeneratedUidCounts = new WeakMap<FormInstance, Map<number | string, number>>();
const formValidateFieldsOriginals = new WeakMap<FormInstance, FormInstance['validateFields']>();
const formSubmitOriginals = new WeakMap<FormInstance, FormInstance['submit']>();

type FlowNodeConfigUpdateParams = {
  filterByTk: number | string;
  values: {
    config: Record<string, unknown>;
  };
};

type FlowNodeResource = {
  update?: (params: FlowNodeConfigUpdateParams) => Promise<unknown> | unknown;
};

type FlowContextWithFlowNodeApi = ReturnType<typeof useFlowEngineContext> & {
  api?: {
    resource?: (name: string) => FlowNodeResource | undefined;
    request?: (params: { method: string; url: string }) => Promise<unknown>;
  };
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
  setSubModel?: (subKey: string, options: CreateModelOptions | FlowModel) => FlowModel;
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

function hasGridContent(model?: FlowModel | null) {
  const items = (model as { subModels?: { items?: unknown[] } } | null | undefined)?.subModels?.items;
  return Array.isArray(items) && items.length > 0;
}

function getPersistableNodeConfig({
  fallback,
  form,
  node,
}: {
  fallback: Record<string, unknown>;
  form: FormInstance;
  node: NodeLike;
}) {
  const nextConfig = { ...fallback };
  for (const key of FLOW_MODEL_CONFIG_KEYS) {
    const value = node.config?.[key];
    if (value !== undefined) {
      nextConfig[key] = value;
    }
  }
  const currentFormConfig = form.getFieldValue(['config']);
  for (const key of GENERATED_CONFIG_KEYS) {
    if (currentFormConfig && typeof currentFormConfig === 'object' && key in currentFormConfig) {
      nextConfig[key] = currentFormConfig[key];
    }
  }
  return nextConfig;
}

function hasPendingGeneratedUidValidation(form: FormInstance) {
  const pendingCounts = formPendingGeneratedUidCounts.get(form);
  return Boolean(pendingCounts && Array.from(pendingCounts.values()).some((count) => count > 0));
}

function ensurePendingGeneratedUidValidation(form: FormInstance, message: string) {
  if (!formValidateFieldsOriginals.has(form)) {
    const originalValidateFields = form.validateFields.bind(form);
    formValidateFieldsOriginals.set(form, form.validateFields);
    form.validateFields = (async (...args: Parameters<FormInstance['validateFields']>) => {
      if (hasPendingGeneratedUidValidation(form)) {
        return Promise.reject({
          values: form.getFieldsValue(true),
          errorFields: [
            {
              name: ['config'],
              errors: [message],
            },
          ],
          outOfDate: false,
        });
      }
      return originalValidateFields(...args);
    }) as FormInstance['validateFields'];
  }
  if (!formSubmitOriginals.has(form)) {
    const originalSubmit = form.submit.bind(form);
    formSubmitOriginals.set(form, form.submit);
    form.submit = (() => {
      if (hasPendingGeneratedUidValidation(form)) {
        form.validateFields().catch(() => undefined);
        return;
      }
      return originalSubmit();
    }) as FormInstance['submit'];
  }
}

function setPendingGeneratedUidValidation({
  form,
  message,
  nodeId,
  pending,
}: {
  form: FormInstance;
  message: string;
  nodeId?: number | string;
  pending: boolean;
}) {
  if (nodeId == null) {
    return;
  }
  ensurePendingGeneratedUidValidation(form, message);
  let pendingCounts = formPendingGeneratedUidCounts.get(form);
  if (!pendingCounts) {
    pendingCounts = new Map();
    formPendingGeneratedUidCounts.set(form, pendingCounts);
  }
  const current = pendingCounts.get(nodeId) || 0;
  const next = pending ? current + 1 : Math.max(0, current - 1);
  if (next) {
    pendingCounts.set(nodeId, next);
  } else {
    pendingCounts.delete(nodeId);
  }
}

function mergePersistedNodeConfigPatch({
  form,
  node,
  patch,
  persistedConfig,
}: {
  form: FormInstance;
  node: NodeLike;
  patch: Record<string, unknown>;
  persistedConfig: Record<string, unknown>;
}) {
  const currentFormConfig = form.getFieldValue(['config']);
  const nextFormConfig = {
    ...persistedConfig,
    ...(currentFormConfig && typeof currentFormConfig === 'object' ? currentFormConfig : {}),
    ...patch,
  };
  for (const key of FLOW_MODEL_CONFIG_KEYS) {
    const value = persistedConfig[key];
    if (value !== undefined) {
      nextFormConfig[key] = value;
    }
  }
  form.setFieldsValue({ config: nextFormConfig });

  node.config = {
    ...persistedConfig,
    ...(node.config || {}),
    ...patch,
  };
  for (const key of FLOW_MODEL_CONFIG_KEYS) {
    const value = persistedConfig[key];
    if (value !== undefined) {
      node.config[key] = value;
    }
  }
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
  canRegenerateUid,
  createModelOptions,
  flowEngine,
  onGeneratedUidChange,
  uid,
  uidPrefix,
}: {
  canRegenerateUid?: boolean;
  createModelOptions: (uid: string) => CreateModelOptions;
  flowEngine: ReturnType<typeof useFlowEngine>;
  onGeneratedUidChange?: (value: string) => Promise<boolean | void> | boolean | void;
  uid: string;
  uidPrefix: string;
}) {
  const options = createModelOptions(uid);
  const expectedUse = getExpectedModelUse(options);
  const loadedModel = (await flowEngine.loadOrCreateModel(options)) as FlowModel | null;
  if (!loadedModel?.uid || !expectedUse || getModelUseName(loadedModel) === expectedUse) {
    return loadedModel;
  }
  if (!canRegenerateUid) {
    return loadedModel;
  }

  flowEngine.removeModelWithSubModels?.(loadedModel.uid);
  const nextUid = randomId(uidPrefix);
  const persisted = await onGeneratedUidChange?.(nextUid);
  if (persisted === false) {
    return null;
  }
  return (await flowEngine.loadOrCreateModel(createModelOptions(nextUid))) as FlowModel | null;
}

async function loadExistingCCGridModel(flowEngine: ReturnType<typeof useFlowEngine>, tabUid: string) {
  await flowEngine.getModelClassAsync?.('CCBlockGridModel');
  return (await flowEngine.loadModel?.({
    parentId: tabUid,
    refresh: true,
    subKey: 'grid',
  })) as FlowModel | null | undefined;
}

async function ensureCCInterfaceStructure(model: FlowModel, flowEngine: ReturnType<typeof useFlowEngine>) {
  const childPageModel = model as ChildPageModelLike;
  let changed = false;
  let tab = childPageModel.subModels?.tabs?.[0];

  if (!tab?.uid && childPageModel.addSubModel) {
    tab = childPageModel.addSubModel('tabs', createCCTabModelOptions()) as TabModelLike;
    changed = true;
  }

  if (tab?.uid) {
    const currentGrid = tab.subModels?.grid;
    if (!hasGridContent(currentGrid)) {
      const existingGrid = await loadExistingCCGridModel(flowEngine, tab.uid);
      if (existingGrid?.uid) {
        tab.setSubModel?.('grid', existingGrid);
      } else if (currentGrid?.uid) {
        await currentGrid.save?.();
      } else if (!currentGrid?.uid && tab.setSubModel) {
        tab.setSubModel('grid', createCCGridModelOptions());
        changed = true;
      } else if (!currentGrid?.uid && tab.addSubModel) {
        tab.addSubModel('grid', createCCGridModelOptions());
        changed = true;
      }
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

async function persistNodeConfigPatch({
  baseConfig,
  ctx,
  disabled,
  node,
  patch,
}: {
  baseConfig: Record<string, unknown>;
  ctx: FlowContextWithFlowNodeApi;
  disabled?: boolean;
  node: NodeLike;
  patch: Record<string, unknown>;
}): Promise<Record<string, unknown> | null> {
  if (disabled || node.id == null) {
    return null;
  }
  const flowNodeResource = ctx.api?.resource?.('flow_nodes');
  if (!flowNodeResource?.update) {
    return null;
  }
  const nextConfig = {
    ...baseConfig,
    ...patch,
  };
  await flowNodeResource.update({
    filterByTk: node.id,
    values: {
      config: nextConfig,
    },
  });
  return nextConfig;
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
  form,
  kind,
  node,
  nodes,
  onGeneratedUidChange,
  onModelReady,
  onNodeConfigPatch,
  uid,
  uidPrefix,
  upstreams,
  workflow,
}: {
  disabled?: boolean;
  form: FormInstance;
  kind: FlowModelConfigKind;
  node: NodeLike;
  nodes?: NodeLike[];
  onGeneratedUidChange?: (value: string) => Promise<boolean | void> | boolean | void;
  onModelReady?: () => void;
  onNodeConfigPatch: (patch: Record<string, unknown>) => Promise<boolean>;
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
    const formConfig = nodeConfig && typeof nodeConfig === 'object' ? form.getFieldValue(['config']) : undefined;
    form.setFieldsValue({
      config: {
        ...(formConfig && typeof formConfig === 'object' ? formConfig : {}),
        tempAssociationFields: fields,
      },
    });
    onNodeConfigPatch({ tempAssociationFields: fields }).catch(() => {
      // The parent drawer now has the latest generated metadata; a later submit can still persist it.
    });
  });
  const { data: model, loading } = useRequest(
    async () => {
      try {
        registerWorkflowCcModelLoaders(flowEngine);
        registerWorkflowCcCollections(flowEngine);
        const nextModel = await loadExpectedModel({
          canRegenerateUid: Boolean(onGeneratedUidChange),
          createModelOptions,
          flowEngine,
          onGeneratedUidChange,
          uid,
          uidPrefix,
        });
        if (!nextModel) {
          return null;
        }
        if (kind === 'interface') {
          await ensureCCInterfaceStructure(nextModel, flowEngine);
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
              workflowCcConfigDialog: true,
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
      } finally {
        onModelReady?.();
      }
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
  const ctx = useFlowEngineContext<FlowContextWithFlowNodeApi>();
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance();
  const workflow = useCurrentWorkflowContext() as WorkflowLike;
  const node = useNodeContext() as NodeLike;
  const canvasContext = useWorkflowCanvasContext() as { nodes?: NodeLike[]; refresh?: () => void };
  const upstreams = useAvailableUpstreams(node) as NodeLike[];
  const nodeIdRef = useRef(node?.id);
  const persistedNodeConfigRef = useRef<Record<string, unknown>>({ ...(node?.config || {}) });
  const openingRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const legacyConfigValue = Form.useWatch(['config', legacyConfigKey || '__workflowCcLegacyConfig__'], form);
  const currentLegacyConfigValue =
    legacyConfigValue ?? (legacyConfigKey ? form.getFieldValue(['config', legacyConfigKey]) : undefined);
  const title = kind === 'interface' ? t('User interface') : t('Task card');
  const uidPrefix = kind === 'interface' ? 'cc_interface_' : 'cc_task_card_';
  const pendingMessage = t('Please wait for the workflow model configuration to finish opening.');
  if (nodeIdRef.current !== node?.id) {
    nodeIdRef.current = node?.id;
    persistedNodeConfigRef.current = { ...(node?.config || {}) };
  }
  const syncNodeConfigPatch = useMemoizedFn(async (patch: Record<string, unknown>) => {
    if (node.id == null) {
      return false;
    }
    const queueKey = node.id;
    setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId: queueKey, pending: true });
    const previousTask = nodeConfigPersistQueues.get(queueKey);
    const currentTask = (async () => {
      const previousPersistedConfig = previousTask ? await previousTask.catch(() => null) : null;
      const baseConfig = getPersistableNodeConfig({
        fallback: previousPersistedConfig || persistedNodeConfigRef.current,
        form,
        node,
      });
      const persistedConfig = await persistNodeConfigPatch({
        baseConfig,
        ctx,
        disabled,
        node,
        patch,
      });
      if (!persistedConfig) {
        return false;
      }
      persistedNodeConfigRef.current = persistedConfig;
      mergePersistedNodeConfigPatch({ form, node, patch, persistedConfig });
      return persistedConfig;
    })();
    nodeConfigPersistQueues.set(queueKey, currentTask);
    try {
      return Boolean(await currentTask);
    } finally {
      setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId: queueKey, pending: false });
      if (nodeConfigPersistQueues.get(queueKey) === currentTask) {
        nodeConfigPersistQueues.delete(queueKey);
      }
    }
  });
  const syncGeneratedUid = useMemoizedFn(async (uid: string) => {
    const synced = await syncNodeConfigPatch({ [configKey]: uid });
    if (!synced) {
      return false;
    }
    onChange?.(uid);
    return true;
  });
  const openConfig = useMemoizedFn(async () => {
    if (disabled || openingRef.current) {
      return;
    }
    openingRef.current = true;
    setOpening(true);
    try {
      const isGeneratedUid = !value;
      const uid = value || randomId(uidPrefix);
      const nodeId = node?.id;
      if (!value) {
        setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId, pending: true });
        try {
          const synced = await syncGeneratedUid(uid);
          if (!synced) {
            return;
          }
        } finally {
          setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId, pending: false });
        }
      }
      let releaseDialogGeneratedUidPending: (() => void) | undefined;
      if (isGeneratedUid) {
        let released = false;
        setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId, pending: true });
        releaseDialogGeneratedUidPending = () => {
          if (released) {
            return;
          }
          released = true;
          setPendingGeneratedUidValidation({ form, message: pendingMessage, nodeId, pending: false });
        };
      }

      ctx.viewer.dialog({
        width: `min(${token.screenLG + token.marginXXL * 2}px, calc(100vw - ${token.marginXXL * 2}px))`,
        closable: true,
        onClose: releaseDialogGeneratedUidPending,
        title,
        styles: {
          body: {
            padding: token.paddingLG,
            backgroundColor: 'var(--nb-box-bg)',
          },
          content: {
            padding: 0,
          },
          header: {
            padding: token.paddingLG,
            marginBottom: 0,
          },
        },
        content: () => (
          <FlowModelConfigDialogContent
            disabled={disabled}
            form={form}
            kind={kind}
            node={node}
            nodes={canvasContext?.nodes}
            onGeneratedUidChange={isGeneratedUid ? syncGeneratedUid : undefined}
            onNodeConfigPatch={syncNodeConfigPatch}
            onModelReady={releaseDialogGeneratedUidPending}
            uid={uid}
            uidPrefix={uidPrefix}
            upstreams={upstreams}
            workflow={workflow}
          />
        ),
      });
    } catch {
      // Keep the generated uid out of local state when the node config cannot be persisted.
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
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
      disabled: disabled || opening,
      onClick: openConfig,
    },
  ];
  const icon = kind === 'interface' ? <SettingOutlined aria-hidden /> : <CreditCardOutlined aria-hidden />;
  const buttonType = kind === 'interface' ? 'primary' : 'default';

  if (kind === 'interface' && currentLegacyConfigValue) {
    return (
      <Dropdown menu={{ items: legacyMenuItems }} trigger={['hover']}>
        <Button disabled={disabled} icon={icon} loading={opening} type={buttonType}>
          {t('Go to configure')} <DownOutlined aria-hidden />
        </Button>
      </Dropdown>
    );
  }

  return (
    <Button disabled={disabled || opening} icon={icon} loading={opening} onClick={openConfig} type={buttonType}>
      {t('Go to configure')}
    </Button>
  );
}

export default FlowModelConfigInput;
