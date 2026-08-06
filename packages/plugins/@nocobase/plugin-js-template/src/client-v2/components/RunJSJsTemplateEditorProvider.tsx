/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ApplicationContext,
  RunJSSourceResolverRegistry,
  type RunJSEditorProvider,
  type RunJSEditorProviderRenderProps,
  type RunJSSourceLocator,
} from '@nocobase/client-v2';
import {
  useFlowContext,
  type FlowEngineContext,
  type FlowModel,
  type ParamObject,
  type RunJSValue,
} from '@nocobase/flow-engine';
import { Alert, Button, Flex, Space } from 'antd';
import React from 'react';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../constants';
import { JS_TEMPLATE_SOURCE_MODE } from '../../shared/jsTemplateRunJSPersistence';
import type { CompiledJsTemplateArtifact, JsTemplateKind, JsTemplateRuntimeSourceBinding } from '../../shared/types';
import { detachJsTemplateToInline, getJsTemplate, type ApiClientLike } from '../api/jsTemplatesRequests';
import { JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT } from '../jsTemplateRunJSIntegrationContract';
import {
  isJsTemplateRuntimeSourceBinding,
  type JsTemplateRunJSSourceResolver,
} from '../resolvers/JsTemplateRunJSResolver';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';
import JsTemplateSourceProjectWorkspacePage, {
  type DetachJsTemplateToInlineRequest,
  type JsTemplateSourceProjectWorkspaceFooterActions,
} from '../pages/JsTemplateSourceProjectWorkspacePage';
import type { JsTemplateWorkspaceScope } from '../workspace/jsTemplateWorkspaceAccess';
import { createInlineJsTemplateWorkspaceTypeScriptContextResolver } from '../workspace/inlineJsTemplateWorkspaceTypeScript';
import { resolveInlineJsTemplateWorkspaceJsonSchema } from '../workspace/jsTemplateWorkspaceJsonSchema';

const INLINE_SOURCE_MODE = 'inline';

type JsTemplateEditorView = {
  close?: () => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
  setFooter?: (footer: React.ReactNode) => void;
};

type JsTemplateEditorFlowContext = FlowEngineContext & {
  api?: ApiClientLike;
  model?: FlowModel;
};

type ApplicationWithApi = {
  apiClient?: ApiClientLike;
};

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type JsTemplateScopedWorkspace = Extract<JsTemplateWorkspaceScope, { mode: 'template' }>;

const UNSAFE_RUNJS_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function waitForHostRefreshCommit(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

const JsTemplateSourceWorkspaceEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { locator, onPreview, sourceLocator, surfaceStyle, value } = props;
  const effectiveLocator = sourceLocator ?? locator;
  const translate = props.t;
  const binding = isJsTemplateRuntimeSourceBinding(props.value.sourceBinding) ? props.value.sourceBinding : null;
  const [currentBinding, setCurrentBinding] = React.useState(binding);
  const [currentEntryPath, setCurrentEntryPath] = React.useState<string | null>(null);
  const [detachedInlineValue, setDetachedInlineValue] = React.useState<RunJSValue | null>(null);
  const [footerActions, setFooterActions] = React.useState<JsTemplateSourceProjectWorkspaceFooterActions | null>(null);
  const flowContext = useFlowContext<JsTemplateEditorFlowContext | null>();
  const app = React.useContext(ApplicationContext) as ApplicationWithApi | null;
  const resolverApi = app?.apiClient;
  const api = flowContext?.api || resolverApi;
  const editorView = flowContext?.view as JsTemplateEditorView | undefined;
  const workspaceScope = currentBinding ? getTemplateWorkspaceScope(currentBinding, currentEntryPath) : null;
  const readonly = Boolean(props.readOnly || props.disabled);
  const persistedValueRef = React.useRef(value);
  const previewAppliedRef = React.useRef(false);
  const previewValueApplierRef = React.useRef<(value: RunJSValue) => Promise<boolean>>(async () => false);
  const detachToInlineAttemptRef = React.useRef<{ requestFingerprint: string; idempotencyKey: string } | null>(null);

  React.useEffect(() => {
    setCurrentBinding(binding);
    setCurrentEntryPath(null);
    if (!binding || !api) {
      return;
    }

    let active = true;
    getJsTemplate(api, binding.templateId)
      .then((template) => {
        if (
          !active ||
          template.id !== binding.templateId ||
          template.projectId !== binding.projectId ||
          template.kind !== binding.kind
        ) {
          return;
        }
        setCurrentEntryPath(template.entryPath);
      })
      .catch(() => {
        // The persisted binding intentionally contains no display or workspace-path metadata.
      });

    return () => {
      active = false;
    };
  }, [api, binding]);

  React.useEffect(() => {
    if (!previewAppliedRef.current) {
      persistedValueRef.current = value;
    }
  }, [value]);

  const applyPreviewValue = React.useCallback(
    async (nextValue: RunJSValue): Promise<boolean> => {
      if (onPreview) {
        await onPreview(nextValue);
        return true;
      }
      return applyFlowModelStepPreview(flowContext, sourceLocator ?? locator, surfaceStyle, nextValue);
    },
    [flowContext, locator, onPreview, sourceLocator, surfaceStyle],
  );
  previewValueApplierRef.current = applyPreviewValue;
  const canPreview =
    Boolean(onPreview) || canApplyFlowModelStepPreview(flowContext, sourceLocator ?? locator, surfaceStyle);

  const restorePreview = React.useCallback(async () => {
    if (!previewAppliedRef.current) {
      return;
    }
    await previewValueApplierRef.current(persistedValueRef.current);
    previewAppliedRef.current = false;
  }, []);

  React.useEffect(() => {
    return () => {
      if (!previewAppliedRef.current) {
        return;
      }
      previewValueApplierRef
        .current(persistedValueRef.current)
        .then(() => {
          previewAppliedRef.current = false;
        })
        .catch((error) => console.error('Failed to restore JS Template workspace preview', error));
    };
  }, []);

  const handleWorkspacePreview = React.useCallback(
    async (artifact: CompiledJsTemplateArtifact) => {
      previewAppliedRef.current = await applyPreviewValue({
        ...value,
        code: artifact.code,
        version: artifact.runtimeVersion,
        sourceMode: INLINE_SOURCE_MODE,
      });
    },
    [applyPreviewValue, value],
  );

  const closeEditorViewWithoutRestore = React.useCallback(async () => {
    if (typeof editorView?.close === 'function') {
      await editorView.close();
      return;
    }

    editorView?.destroy?.();
  }, [editorView]);
  const closeEditorView = React.useCallback(async () => {
    await restorePreview();
    await closeEditorViewWithoutRestore();
  }, [closeEditorViewWithoutRestore, restorePreview]);

  const handleDetachJsTemplateToInline = React.useCallback(
    async (request: DetachJsTemplateToInlineRequest) => {
      if (!api || !currentBinding || !workspaceScope || effectiveLocator?.kind !== 'flowModel.step') {
        throw new Error(translate?.('RunJS source service is unavailable') || 'RunJS source service is unavailable');
      }

      const detachInput = {
        locator: {
          ...effectiveLocator,
          paramPath: [...effectiveLocator.paramPath],
          versionPath: effectiveLocator.versionPath ? [...effectiveLocator.versionPath] : undefined,
        },
        projectId: currentBinding.projectId,
        templateId: currentBinding.templateId,
        expectedProjectHeadCommitId: request.expectedProjectHeadCommitId,
      };
      const requestFingerprint = JSON.stringify(detachInput);
      const existingAttempt = detachToInlineAttemptRef.current;
      const attempt =
        existingAttempt?.requestFingerprint === requestFingerprint
          ? existingAttempt
          : { requestFingerprint, idempotencyKey: createDetachJsTemplateToInlineIdempotencyKey() };
      detachToInlineAttemptRef.current = attempt;
      const result = await detachJsTemplateToInline(api, {
        ...detachInput,
        idempotencyKey: attempt.idempotencyKey,
      });
      detachToInlineAttemptRef.current = null;
      const nextValue = {
        ...value,
        code: result.code,
        version: result.runtimeVersion,
        sourceMode: INLINE_SOURCE_MODE,
        sourceBinding: undefined,
        sourceRef: result.sourceRef,
      };
      persistedValueRef.current = nextValue;
      previewAppliedRef.current = false;
      setDetachedInlineValue(nextValue);
      await (props.onPersistedChange || props.onChange)?.(nextValue);
    },
    [currentBinding, api, effectiveLocator, props.onChange, props.onPersistedChange, translate, value, workspaceScope],
  );
  const handlePersistedChange = React.useCallback(async () => {
    let nextValue = props.value;
    let refreshedBinding = currentBinding;
    if (api && currentBinding) {
      const registeredResolver = RunJSSourceResolverRegistry.getResolver(
        JS_TEMPLATE_SOURCE_MODE,
      ) as Partial<JsTemplateRunJSSourceResolver> | null;
      registeredResolver?.invalidateCache?.(currentBinding.projectId);
      const cacheApis = [api, resolverApi].filter((item): item is ApiClientLike => Boolean(item));
      for (const cacheApi of new Set(cacheApis)) {
        invalidateJsTemplateSettingsDescriptorCache(cacheApi, currentBinding.projectId);
        invalidateJsTemplateRuntimeCache(cacheApi, currentBinding.projectId);
      }
      try {
        const template = await getJsTemplate(api, currentBinding.templateId);
        if (
          template.id === currentBinding.templateId &&
          template.projectId === currentBinding.projectId &&
          template.kind === currentBinding.kind
        ) {
          refreshedBinding = currentBinding;
          setCurrentEntryPath(template.entryPath);
          setCurrentBinding(refreshedBinding);
          if (template.runtimeArtifact) {
            nextValue = {
              ...nextValue,
              code: template.runtimeArtifact.code,
              version: template.runtimeArtifact.runtimeVersion,
            };
          }
        }
      } catch {
        // Keep the persisted binding when the refreshed template metadata cannot be read immediately.
      }
      const resolver = RunJSSourceResolverRegistry.getResolver(JS_TEMPLATE_SOURCE_MODE);
      if (refreshedBinding && typeof resolver?.getBindingTitle === 'function') {
        try {
          await resolver.getBindingTitle({
            sourceMode: JS_TEMPLATE_SOURCE_MODE,
            sourceBinding: refreshedBinding,
            settings: isRecord(props.value.settings) ? props.value.settings : undefined,
          });
        } catch {
          // Cache invalidation is still effective when the selectable template refresh temporarily fails.
        }
      }
    }
    const persistedValue = {
      ...nextValue,
      ...(refreshedBinding ? { sourceBinding: refreshedBinding } : {}),
    };
    persistedValueRef.current = persistedValue;
    previewAppliedRef.current = false;
    await (props.onPersistedChange || props.onChange)?.(persistedValue);
    await waitForHostRefreshCommit();
  }, [api, currentBinding, props.onChange, props.onPersistedChange, props.value, resolverApi]);

  React.useEffect(() => {
    if (typeof editorView?.setFooter !== 'function') {
      return;
    }

    if (!footerActions) {
      editorView.setFooter(null);
      return;
    }

    editorView.setFooter(
      <Space>
        <Button disabled={footerActions.loading} onClick={footerActions.onCancel}>
          {translate?.('Cancel') || 'Cancel'}
        </Button>
        <Button
          disabled={footerActions.disabled}
          loading={footerActions.loading}
          onClick={footerActions.onSave}
          type="primary"
        >
          {translate?.('Save') || 'Save'}
        </Button>
      </Space>,
    );

    return () => {
      editorView.setFooter?.(null);
    };
  }, [editorView, footerActions, translate]);

  if (detachedInlineValue) {
    return <InlineJsTemplateWorkspaceEditor {...props} value={detachedInlineValue} />;
  }

  if (!currentBinding || !workspaceScope) {
    return <Alert message={props.t?.('Selected JS Template is unavailable')} showIcon type="error" />;
  }

  return (
    <Flex
      data-testid="js-template-source-workspace-editor"
      vertical
      style={{ height: 'calc(100vh - 96px)', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
    >
      <JsTemplateSourceProjectWorkspacePage
        defaultFilesCollapsed
        embedded
        templateId={currentBinding.templateId}
        initialPath={currentEntryPath || undefined}
        onFooterActionsChange={setFooterActions}
        onDetachJsTemplateToInline={
          effectiveLocator?.kind === 'flowModel.step' && api && !readonly ? handleDetachJsTemplateToInline : undefined
        }
        onPreview={canPreview ? handleWorkspacePreview : undefined}
        onRequestClose={closeEditorView}
        onSaved={handlePersistedChange}
        projectId={currentBinding.projectId}
        workspaceScope={workspaceScope}
      />
    </Flex>
  );
};

const InlineJsTemplateWorkspaceEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { onChange, onPersistedChange, onPreview, surfaceStyle } = props;
  const flowContext = useFlowContext<JsTemplateEditorFlowContext | null>();
  const persistedValueRef = React.useRef(props.value);
  const previewAppliedRef = React.useRef(false);
  const previewValueApplierRef = React.useRef<(value: RunJSValue) => Promise<boolean>>(async () => false);
  const locator = props.sourceLocator ?? props.locator;
  const applyPreviewValue = React.useCallback(
    async (value: RunJSValue): Promise<boolean> => {
      if (onPreview) {
        await onPreview(value);
        return true;
      }
      return applyFlowModelStepPreview(flowContext, locator, surfaceStyle, value);
    },
    [flowContext, locator, onPreview, surfaceStyle],
  );
  previewValueApplierRef.current = applyPreviewValue;
  const canPreview = Boolean(onPreview) || canApplyFlowModelStepPreview(flowContext, locator, surfaceStyle);

  React.useEffect(() => {
    if (!previewAppliedRef.current) {
      persistedValueRef.current = props.value;
    }
  }, [props.value]);

  React.useEffect(() => {
    return () => {
      if (!previewAppliedRef.current) {
        return;
      }
      previewValueApplierRef
        .current(persistedValueRef.current)
        .then(() => {
          previewAppliedRef.current = false;
        })
        .catch((error) => console.error('Failed to restore inline RunJS preview', error));
    };
  }, []);

  const handlePreview = React.useCallback(
    async (value: RunJSValue) => {
      previewAppliedRef.current = await applyPreviewValue(value);
    },
    [applyPreviewValue],
  );
  const handleChange = React.useCallback(
    (value: RunJSValue | string) => {
      persistedValueRef.current = typeof value === 'string' ? { ...persistedValueRef.current, code: value } : value;
      previewAppliedRef.current = false;
      onChange?.(value);
    },
    [onChange],
  );
  const handlePersistedChange = React.useCallback(
    async (value: RunJSValue) => {
      persistedValueRef.current = value;
      previewAppliedRef.current = false;
      await (onPersistedChange || onChange)?.(value);
    },
    [onChange, onPersistedChange],
  );

  const jsTemplateKind = getJsTemplateKind(props.sourceMetadata);
  return props.renderNext?.({
    value: props.value,
    workspaceJsonSchemaResolver: resolveInlineJsTemplateWorkspaceJsonSchema,
    ...(jsTemplateKind
      ? {
          workspaceTypeScriptContextResolver: createInlineJsTemplateWorkspaceTypeScriptContextResolver(jsTemplateKind),
        }
      : {}),
    onPreview: canPreview ? handlePreview : undefined,
    onChange: handleChange,
    onPersistedChange: handlePersistedChange,
  });
};

export function createJsTemplateRunJSEditorProvider(): RunJSEditorProvider {
  return {
    key: JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.editorProviderKey,
    priority: 100,
    canHandle(props) {
      const locator = props.sourceLocator ?? props.locator;
      if (locator?.kind !== 'flowModel.step') {
        return false;
      }
      return props.value.sourceMode === JS_TEMPLATE_SOURCE_MODE || isJsTemplateSourceMetadata(props.sourceMetadata);
    },
    renderEditor(props) {
      const locator = props.sourceLocator ?? props.locator;
      if (locator?.kind !== 'flowModel.step') {
        return props.renderNext?.() ?? null;
      }
      return props.value.sourceMode === JS_TEMPLATE_SOURCE_MODE ? (
        <JsTemplateSourceWorkspaceEditor {...props} />
      ) : (
        <InlineJsTemplateWorkspaceEditor {...props} />
      );
    },
  };
}

function isJsTemplateSourceMetadata(value: unknown): boolean {
  return Boolean(getJsTemplateKind(value));
}

function getJsTemplateKind(value: unknown): JsTemplateKind | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const kind = value[JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.sourceMetadataKindKey];
  return typeof kind === 'string' && (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(kind)
    ? (kind as JsTemplateKind)
    : undefined;
}

export function createDetachJsTemplateToInlineIdempotencyKey(): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === 'function') {
    return `detach-to-inline-${randomUuid.call(globalThis.crypto)}`;
  }
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/gu, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
  return `detach-to-inline-${uuid}`;
}

function getTemplateWorkspaceScope(
  binding: JsTemplateRuntimeSourceBinding,
  entryPath: string | null,
): JsTemplateScopedWorkspace | null {
  if (
    typeof entryPath !== 'string' ||
    !entryPath.trim() ||
    !(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(binding.kind)
  ) {
    return null;
  }

  return {
    mode: 'template',
    entryPath,
    kind: binding.kind as JsTemplateKind,
  };
}

function canApplyFlowModelStepPreview(
  flowContext: JsTemplateEditorFlowContext | null,
  locator: RunJSSourceLocator | undefined,
  surfaceStyle: RunJSEditorProviderRenderProps['surfaceStyle'],
): locator is FlowModelStepLocator {
  return Boolean(flowContext?.model && locator?.kind === 'flowModel.step' && surfaceStyle === 'render');
}

async function applyFlowModelStepPreview(
  flowContext: JsTemplateEditorFlowContext | null,
  locator: RunJSSourceLocator | undefined,
  surfaceStyle: RunJSEditorProviderRenderProps['surfaceStyle'],
  value: RunJSValue,
): Promise<boolean> {
  if (!canApplyFlowModelStepPreview(flowContext, locator, surfaceStyle)) {
    return false;
  }

  const model = flowContext.model;
  if (!model) {
    return false;
  }
  const currentParams = cloneJsonRecordValue(model.getStepParams(locator.flowKey, locator.stepKey));
  setPreviewValueAtPath(currentParams, locator.paramPath, value.code);
  setPreviewValueAtPath(
    currentParams,
    locator.versionPath?.length ? locator.versionPath : resolvePreviewVersionPath(locator.paramPath),
    value.version,
  );
  const sourceConfigPath = locator.paramPath.slice(0, -1);
  setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'sourceMode'], value.sourceMode);
  if (Object.prototype.hasOwnProperty.call(value, 'sourceBinding')) {
    setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'sourceBinding'], value.sourceBinding);
  }
  if (Object.prototype.hasOwnProperty.call(value, 'settings')) {
    setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'settings'], value.settings);
  }
  model.setStepParams(locator.flowKey, locator.stepKey, currentParams);
  model.invalidateFlowCache('beforeRender', true);
  await model.rerender();
  return true;
}

function cloneJsonRecordValue(value: unknown): ParamObject {
  return isRecord(value) ? (cloneJsonRecord(value) as ParamObject) : {};
}

function resolvePreviewVersionPath(paramPath: readonly string[]): string[] {
  return paramPath.length > 1 ? [...paramPath.slice(0, -1), 'version'] : ['version'];
}

function setPreviewValueAtPath(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  if (!path.length || path.some((segment) => UNSAFE_RUNJS_PATH_SEGMENTS.has(segment))) {
    return;
  }

  let target = root;
  for (const segment of path.slice(0, -1)) {
    const next = cloneJsonRecordValue(target[segment]);
    target[segment] = next;
    target = next;
  }
  target[path[path.length - 1]] = value;
}
