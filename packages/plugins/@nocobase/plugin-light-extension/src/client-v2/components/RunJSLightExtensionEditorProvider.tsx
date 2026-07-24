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
import { useFlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import { Alert, Button, Flex, Space } from 'antd';
import React from 'react';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type { LightExtensionKind, LightExtensionRuntimeSourceBinding } from '../../shared/types';
import {
  getLightExtensionEntry,
  moveLightExtensionToInline,
  type ApiClientLike,
} from '../api/lightExtensionEntriesRequests';
import {
  isLightExtensionRuntimeSourceBinding,
  type LightExtensionRunJSSourceResolver,
} from '../resolvers/LightExtensionRunJSResolver';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { invalidateLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';
import LightExtensionWorkspacePage, {
  type LightExtensionMoveToInlineRequest,
  type LightExtensionWorkspaceFooterActions,
} from '../pages/LightExtensionWorkspacePage';
import type { LightExtensionWorkspaceScope } from '../workspace/lightExtensionWorkspaceAccess';
import { createInlineLightExtensionWorkspaceTypeScriptContextResolver } from '../workspace/inlineLightExtensionWorkspaceTypeScript';
import { resolveInlineLightExtensionWorkspaceJsonSchema } from '../workspace/lightExtensionWorkspaceJsonSchema';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type LightExtensionEditorView = {
  close?: () => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
  setFooter?: (footer: React.ReactNode) => void;
};

type LightExtensionEditorFlowContext = FlowEngineContext & {
  api?: ApiClientLike;
};

type ApplicationWithApi = {
  apiClient?: ApiClientLike;
};

type LightExtensionEntryWorkspaceScope = Extract<LightExtensionWorkspaceScope, { mode: 'entry' }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function waitForHostRefreshCommit(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

const LightExtensionSourceWorkspaceEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { locator, sourceLocator, value } = props;
  const effectiveLocator = sourceLocator ?? locator;
  const translate = props.t;
  const binding = isLightExtensionRuntimeSourceBinding(props.value.sourceBinding) ? props.value.sourceBinding : null;
  const [currentBinding, setCurrentBinding] = React.useState(binding);
  const [footerActions, setFooterActions] = React.useState<LightExtensionWorkspaceFooterActions | null>(null);
  const flowContext = useFlowContext<LightExtensionEditorFlowContext | null>();
  const app = React.useContext(ApplicationContext) as ApplicationWithApi | null;
  const resolverApi = app?.apiClient;
  const api = flowContext?.api || resolverApi;
  const editorView = flowContext?.view as LightExtensionEditorView | undefined;
  const workspaceScope = currentBinding ? getEntryWorkspaceScope(currentBinding) : null;
  const readonly = Boolean(props.readOnly || props.disabled);

  React.useEffect(() => {
    setCurrentBinding(binding);
    if (!binding || !api) {
      return;
    }

    let active = true;
    getLightExtensionEntry(api, binding.entryId)
      .then((entry) => {
        if (!active || entry.id !== binding.entryId || entry.repoId !== binding.repoId || entry.kind !== binding.kind) {
          return;
        }
        setCurrentBinding({
          ...binding,
          entryName: entry.entryName,
          entryPath: entry.entryPath,
          entryTitle: entry.entryName || entry.id,
        });
      })
      .catch(() => {
        // Keep the persisted binding as a fallback when the current entry cannot be refreshed.
      });

    return () => {
      active = false;
    };
  }, [api, binding]);

  const closeEditorView = React.useCallback(async () => {
    if (typeof editorView?.close === 'function') {
      await editorView.close();
      return;
    }

    editorView?.destroy?.();
  }, [editorView]);

  const handleMoveToInline = React.useCallback(
    async (request: LightExtensionMoveToInlineRequest) => {
      if (!api || !currentBinding || !workspaceScope || effectiveLocator?.kind !== 'flowModel.step') {
        throw new Error(translate?.('RunJS source service is unavailable') || 'RunJS source service is unavailable');
      }

      const result = await moveLightExtensionToInline(api, {
        locator: {
          ...effectiveLocator,
          paramPath: [...effectiveLocator.paramPath],
          versionPath: effectiveLocator.versionPath ? [...effectiveLocator.versionPath] : undefined,
        },
        repoId: currentBinding.repoId,
        entryId: currentBinding.entryId,
        entryPath: request.entryPath,
        kind: workspaceScope.kind,
        version: request.version,
        files: request.files,
      });
      const nextValue = {
        ...value,
        code: result.code,
        version: result.version,
        sourceMode: INLINE_SOURCE_MODE,
        sourceBinding: undefined,
        sourceRef: result.sourceRef,
      };
      await (props.onPersistedChange || props.onChange)?.(nextValue);
      await closeEditorView();
    },
    [
      closeEditorView,
      currentBinding,
      api,
      effectiveLocator,
      props.onChange,
      props.onPersistedChange,
      translate,
      value,
      workspaceScope,
    ],
  );
  const handlePersistedChange = React.useCallback(async () => {
    let nextValue = props.value;
    let refreshedBinding = currentBinding;
    if (api && currentBinding) {
      const registeredResolver = RunJSSourceResolverRegistry.getResolver(
        LIGHT_EXTENSION_SOURCE_MODE,
      ) as Partial<LightExtensionRunJSSourceResolver> | null;
      registeredResolver?.invalidateCache?.(currentBinding.repoId);
      const cacheApis = [api, resolverApi].filter((item): item is ApiClientLike => Boolean(item));
      for (const cacheApi of new Set(cacheApis)) {
        invalidateLightExtensionSettingsDescriptorCache(cacheApi, currentBinding.repoId);
        invalidateLightExtensionRuntimeCache(cacheApi, currentBinding.repoId);
      }
      try {
        const entry = await getLightExtensionEntry(api, currentBinding.entryId);
        if (
          entry.id === currentBinding.entryId &&
          entry.repoId === currentBinding.repoId &&
          entry.kind === currentBinding.kind
        ) {
          refreshedBinding = {
            ...currentBinding,
            entryName: entry.entryName,
            entryPath: entry.entryPath,
            entryTitle: entry.entryName || entry.id,
          };
          setCurrentBinding(refreshedBinding);
          if (entry.runtimeArtifact) {
            nextValue = {
              ...nextValue,
              code: entry.runtimeArtifact.code,
              version: entry.runtimeArtifact.version,
            };
          }
        }
      } catch {
        // Keep the persisted binding when the refreshed entry metadata cannot be read immediately.
      }
      const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
      if (refreshedBinding && typeof resolver?.getBindingTitle === 'function') {
        try {
          await resolver.getBindingTitle({
            sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
            sourceBinding: refreshedBinding,
            settings: isRecord(props.value.settings) ? props.value.settings : undefined,
          });
        } catch {
          // Cache invalidation is still effective when the selectable entry refresh temporarily fails.
        }
      }
    }
    const persistedValue = {
      ...nextValue,
      ...(refreshedBinding ? { sourceBinding: refreshedBinding } : {}),
    };
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

  if (!currentBinding || !workspaceScope) {
    return <Alert message={props.t?.('Selected light extension entry is unavailable')} showIcon type="error" />;
  }

  return (
    <Flex
      data-testid="light-extension-source-workspace-editor"
      vertical
      style={{ height: 'calc(100vh - 96px)', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
    >
      <LightExtensionWorkspacePage
        defaultFilesCollapsed
        embedded
        entryId={currentBinding.entryId}
        initialPath={currentBinding.entryPath}
        onFooterActionsChange={setFooterActions}
        onMoveToInline={
          effectiveLocator?.kind === 'flowModel.step' && api && !readonly ? handleMoveToInline : undefined
        }
        onRequestClose={closeEditorView}
        onSaved={handlePersistedChange}
        repoId={currentBinding.repoId}
        workspaceScope={workspaceScope}
      />
    </Flex>
  );
};

const InlineLightExtensionWorkspaceEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { onChange, onPersistedChange } = props;
  const handleChange = React.useCallback(
    (value: RunJSValue | string) => {
      onChange?.(value);
    },
    [onChange],
  );
  const handlePersistedChange = React.useCallback(
    async (value: RunJSValue) => {
      await (onPersistedChange || onChange)?.(value);
    },
    [onChange, onPersistedChange],
  );

  const lightExtensionKind = getLightExtensionKind(props.sourceMetadata);
  return props.renderNext?.({
    workspaceJsonSchemaResolver: resolveInlineLightExtensionWorkspaceJsonSchema,
    ...(lightExtensionKind
      ? {
          workspaceTypeScriptContextResolver:
            createInlineLightExtensionWorkspaceTypeScriptContextResolver(lightExtensionKind),
        }
      : {}),
    onChange: handleChange,
    onPersistedChange: handlePersistedChange,
  });
};

export function createRunJSLightExtensionEditorProvider(): RunJSEditorProvider {
  return {
    key: 'light-extension-runjs-value',
    priority: 100,
    canHandle(props) {
      const locator = props.sourceLocator ?? props.locator;
      if (locator?.kind !== 'flowModel.step') {
        return false;
      }
      return (
        props.value.sourceMode === LIGHT_EXTENSION_SOURCE_MODE || isLightExtensionSourceMetadata(props.sourceMetadata)
      );
    },
    renderEditor(props) {
      const locator = props.sourceLocator ?? props.locator;
      if (locator?.kind !== 'flowModel.step') {
        return props.renderNext?.() ?? null;
      }
      return props.value.sourceMode === LIGHT_EXTENSION_SOURCE_MODE ? (
        <LightExtensionSourceWorkspaceEditor {...props} />
      ) : (
        <InlineLightExtensionWorkspaceEditor {...props} />
      );
    },
  };
}

function isLightExtensionSourceMetadata(value: unknown): boolean {
  return Boolean(getLightExtensionKind(value));
}

function getLightExtensionKind(value: unknown): LightExtensionKind | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const kind = value.lightExtensionKind;
  return typeof kind === 'string' && (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind)
    ? (kind as LightExtensionKind)
    : undefined;
}

function getEntryWorkspaceScope(binding: LightExtensionRuntimeSourceBinding): LightExtensionEntryWorkspaceScope | null {
  if (
    typeof binding.entryPath !== 'string' ||
    !binding.entryPath.trim() ||
    !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(binding.kind)
  ) {
    return null;
  }

  return {
    mode: 'entry',
    entryPath: binding.entryPath,
    kind: binding.kind as LightExtensionKind,
  };
}
