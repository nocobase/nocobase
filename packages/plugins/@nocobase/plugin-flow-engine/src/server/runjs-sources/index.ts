/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type {
  RunJSCompileDiagnostic,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAdapter,
} from '@nocobase/plugin-vsc-file';

import type { FlowSurfaceErrorItemInput } from '../flow-surfaces/errors';
import { inspectRunJsAuthoringCode } from '../flow-surfaces/runjs-authoring';
import { createFlowModelRunJSSourceAdapters } from './flow-model-adapters';

type PluginWithApp = {
  db: Database;
  app: {
    pm: PluginManagerLike;
    on?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
    off?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
    removeListener?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  };
};

type PluginLoadListener = (plugin: unknown, options?: unknown) => void;

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type RunJSSourceAdapterRegistrar = {
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
};

type RunJSSourceAuthoringInspectorRegistrar = {
  registerRunJSSourceAuthoringInspector: (inspector: RunJSSourceAuthoringInspector) => () => void;
};

const VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];

export function registerFlowModelRunJSSourceAdapters(plugin: PluginWithApp): void {
  let registered = false;

  const tryRegister = (): boolean => {
    if (registered) {
      return true;
    }
    const registrar = findRunJSSourceAdapterRegistrar(plugin.app.pm);
    if (!registrar) {
      return false;
    }

    registered = true;
    for (const adapter of createFlowModelRunJSSourceAdapters(plugin.db)) {
      registrar.registerRunJSSourceAdapter(adapter);
    }
    if (isRunJSSourceAuthoringInspectorRegistrar(registrar)) {
      registrar.registerRunJSSourceAuthoringInspector(inspectFlowEngineRunJSSourceAuthoring);
    }

    return true;
  };

  if (tryRegister()) {
    return;
  }

  const onAfterLoadPlugin: PluginLoadListener = () => {
    if (tryRegister()) {
      removeAfterLoadPluginListener(plugin, onAfterLoadPlugin);
    }
  };
  plugin.app.on?.('afterLoadPlugin', onAfterLoadPlugin);
}

function removeAfterLoadPluginListener(plugin: PluginWithApp, listener: PluginLoadListener): void {
  if (plugin.app.off) {
    plugin.app.off('afterLoadPlugin', listener);
    return;
  }
  plugin.app.removeListener?.('afterLoadPlugin', listener);
}

function findRunJSSourceAdapterRegistrar(pm: PluginManagerLike): RunJSSourceAdapterRegistrar | null {
  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isRunJSSourceAdapterRegistrar(plugin)) {
      return plugin;
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return null;
  }

  for (const plugin of plugins.values()) {
    if (isRunJSSourceAdapterRegistrar(plugin)) {
      return plugin;
    }
  }

  return null;
}

function isRunJSSourceAdapterRegistrar(value: unknown): value is RunJSSourceAdapterRegistrar {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { registerRunJSSourceAdapter?: unknown }).registerRunJSSourceAdapter === 'function'
  );
}

function isRunJSSourceAuthoringInspectorRegistrar(value: unknown): value is RunJSSourceAuthoringInspectorRegistrar {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { registerRunJSSourceAuthoringInspector?: unknown }).registerRunJSSourceAuthoringInspector ===
      'function'
  );
}

const inspectFlowEngineRunJSSourceAuthoring: RunJSSourceAuthoringInspector = (
  input: RunJSSourceAuthoringInspectionInput,
) => {
  if (input.locator?.kind === 'flowModel.step') {
    return [];
  }

  return inspectRunJsAuthoringCode({
    code: input.code,
    path: input.path,
    modelUse: resolveRunJSSourceAuthoringModelUse(input),
    surface: resolveRunJSSourceAuthoringSurface(input),
    surfaceStyle: input.surfaceStyle,
  }).map((error) => flowSurfaceErrorToRunJSDiagnostic(input, error));
};

function resolveRunJSSourceAuthoringModelUse(input: RunJSSourceAuthoringInspectionInput): string | undefined {
  const metadataModelUse = readMetadataString(input.legacy?.metadata, 'modelUse');
  if (metadataModelUse) {
    return metadataModelUse;
  }

  if (input.locator?.kind === 'chart.option') {
    return 'ChartOptionModel';
  }
  if (input.locator?.kind === 'chart.events') {
    return 'ChartEventsModel';
  }

  return undefined;
}

function resolveRunJSSourceAuthoringSurface(input: RunJSSourceAuthoringInspectionInput): string | undefined {
  const modelUse = resolveRunJSSourceAuthoringModelUse(input);
  if (!modelUse) {
    return undefined;
  }
  if (input.surfaceStyle === 'render') {
    return 'js-model.render';
  }
  if (input.surfaceStyle === 'action') {
    return 'js-model.action';
  }

  return undefined;
}

function flowSurfaceErrorToRunJSDiagnostic(
  input: RunJSSourceAuthoringInspectionInput,
  error: FlowSurfaceErrorItemInput,
): RunJSCompileDiagnostic {
  return {
    severity: 'error',
    code: 'RUNJS_COMPILE_FAILED',
    ruleId: error.ruleId,
    path: error.path || input.path,
    ...locationFromIndex(input.code, error.index),
    message: error.message,
    details: toUnknownRecord(error.details),
  };
}

function locationFromIndex(source: string, index: unknown): Pick<RunJSCompileDiagnostic, 'line' | 'column'> {
  if (typeof index !== 'number' || !Number.isFinite(index) || index < 0) {
    return {};
  }

  const before = source.slice(0, index).replace(/\r\n?/g, '\n');
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function toUnknownRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value ? value : undefined;
}
