/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildWrapperFieldChildren,
  type CreateModelOptions,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import type { RunJSSurfaceMenuItemProvider, RunJSSurfaceMenuItemProviderContext } from '@nocobase/client-v2';
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionRepoRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import {
  listLightExtensionRepos,
  listSelectableLightExtensionEntries,
  type ApiClientLike,
} from '../api/lightExtensionEntriesRequests';

export type LightExtensionModelMenuTarget = 'block' | 'action' | 'field' | 'column';

export type LightExtensionModelMenuOptions =
  | { target: 'block'; modelUse?: string }
  | { target: 'action'; modelUse: string }
  | {
      target: 'field';
      itemModelUse: string;
      fieldModelUse: string;
      refreshTargets: string[];
    }
  | { target: 'column'; modelUse?: string };

const targetKinds: Record<LightExtensionModelMenuTarget, LightExtensionKind> = {
  block: 'js-block',
  action: 'js-action',
  field: 'js-field',
  column: 'js-field',
};

const defaultModelUses: Partial<Record<LightExtensionModelMenuTarget, string>> = {
  block: 'JSBlockModel',
  column: 'JSColumnModel',
};

const ACTION_MODEL_USES = [
  'JSActionModel',
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
] as const;

const FIELD_SURFACE_OPTIONS: Partial<
  Record<Exclude<RunJSSurfaceMenuItemProviderContext['surface'], 'block' | 'action'>, LightExtensionModelMenuOptions>
> = {
  'form-field': {
    target: 'field',
    itemModelUse: 'FormItemModel',
    fieldModelUse: 'JSEditableFieldModel',
    refreshTargets: ['FormItemModel', 'FormJSFieldItemModel'],
  },
  'details-field': {
    target: 'field',
    itemModelUse: 'DetailsItemModel',
    fieldModelUse: 'JSFieldModel',
    refreshTargets: ['DetailsItemModel', 'DetailsJSFieldItemModel'],
  },
  'table-column': { target: 'column', modelUse: 'JSColumnModel' },
};

export function createLightExtensionSurfaceMenuProvider(api: ApiClientLike): RunJSSurfaceMenuItemProvider {
  return async (context) => {
    const options = resolveSurfaceMenuOptions(context);
    if (!options) {
      return null;
    }
    const source = createLightExtensionModelMenuProvider(api, options);
    const items = Array.isArray(source) ? source : await source(context.ctx);
    return items[0] || null;
  };
}

export function createLightExtensionModelMenuProvider(
  api: ApiClientLike,
  options: LightExtensionModelMenuOptions,
): SubModelItemsType {
  return (ctx) => [
    {
      key: 'light-extension',
      label: translate(ctx, 'Light extension'),
      sort: options.target === 'field' ? 111 : undefined,
      useModel: options.target === 'action' ? getModelUse(options) : undefined,
      searchable: true,
      children: async (childrenContext) => {
        try {
          return await buildRepoItems(api, options, childrenContext);
        } catch {
          return [
            {
              key: 'light-extension-load-error',
              label: translate(childrenContext, 'Failed to load entries'),
              disabled: true,
            },
          ];
        }
      },
    },
  ];
}

async function buildRepoItems(
  api: ApiClientLike,
  options: LightExtensionModelMenuOptions,
  ctx: FlowModelContext,
): Promise<SubModelItem[]> {
  const kind = targetKinds[options.target];
  const [entries, repos] = await Promise.all([
    listSelectableLightExtensionEntries(api, { kind }),
    listLightExtensionRepos(api),
  ]);
  const repoLabels = new Map(repos.map((repo) => [repo.id, getRepoLabel(repo)]));
  const entriesByRepo = entries
    .filter((entry) => matchesTarget(entry, options.target))
    .reduce((groups, entry) => {
      const group = groups.get(entry.repoId);
      if (group) {
        group.push(entry);
      } else {
        groups.set(entry.repoId, [entry]);
      }
      return groups;
    }, new Map<string, LightExtensionSelectableEntrySummary[]>());

  return Array.from(entriesByRepo, ([repoId, repoEntries]) => {
    const repoLabel = repoLabels.get(repoId) || repoId;
    return {
      key: `light-extension-repo:${repoId}`,
      label: repoLabel,
      children: repoEntries.map((entry) => createEntryMenuItem(entry, repoLabel, options, ctx)),
    } satisfies SubModelItem;
  });
}

function matchesTarget(entry: LightExtensionSelectableEntrySummary, target: LightExtensionModelMenuTarget): boolean {
  if (entry.kind !== targetKinds[target] || entry.runtimeAvailable !== true) {
    return false;
  }
  if (target === 'field') {
    return entry.category !== 'js-column';
  }
  if (target === 'column') {
    return entry.category === 'js-column';
  }
  return true;
}

function createEntryMenuItem(
  entry: LightExtensionSelectableEntrySummary,
  repoLabel: string,
  options: LightExtensionModelMenuOptions,
  ctx: FlowModelContext,
): SubModelItem {
  const runJs = createRunJs(entry, repoLabel);
  if (options.target === 'field') {
    return {
      key: `light-extension-entry:${entry.id}`,
      label: getEntryLabel(entry),
      searchable: true,
      searchPlaceholder: translate(ctx, 'Search fields'),
      children: (ctx) =>
        createBoundFieldItems(ctx, {
          itemModelUse: options.itemModelUse,
          fieldModelUse: options.fieldModelUse,
          refreshTargets: options.refreshTargets,
          runJs,
        }),
    };
  }

  const modelUse = getModelUse(options);
  return {
    key: `light-extension-entry:${entry.id}`,
    label: getEntryLabel(entry),
    useModel: modelUse,
    createModelOptions: createEntryModelOptions(entry, runJs, options, modelUse),
  };
}

function createRunJs(entry: LightExtensionSelectableEntrySummary, repoLabel: string) {
  return {
    version: 'v2',
    sourceMode: 'light-extension',
    sourceBinding: createRuntimeSourceBinding(entry, repoLabel),
    settings: extractRunJSSettingsDefaults(entry.settingsSchema),
  };
}

function createBoundFieldItems(
  ctx: FlowModelContext,
  options: {
    itemModelUse: string;
    fieldModelUse: string;
    refreshTargets: string[];
    runJs: ReturnType<typeof createRunJs>;
  },
): SubModelItem[] {
  const groups = buildWrapperFieldChildren(ctx, {
    useModel: options.itemModelUse,
    fieldUseModel: options.fieldModelUse,
    refreshTargets: options.refreshTargets,
  });
  const children = groups[0]?.children;
  return bindRunJsToFieldItems(Array.isArray(children) ? children : [], options.runJs);
}

function bindRunJsToFieldItems(items: SubModelItem[], runJs: ReturnType<typeof createRunJs>): SubModelItem[] {
  return items.map((item) => {
    const next: SubModelItem = { ...item };
    if (Array.isArray(next.children)) {
      next.children = bindRunJsToFieldItems(next.children, runJs);
    } else if (typeof next.children === 'function') {
      const resolveChildren = next.children;
      next.children = async (ctx) => bindRunJsToFieldItems(await resolveChildren(ctx), runJs);
    }
    if (next.createModelOptions) {
      const resolveOptions = next.createModelOptions;
      next.createModelOptions = async (ctx) => {
        const resolved = (
          typeof resolveOptions === 'function' ? await resolveOptions(ctx) : resolveOptions
        ) as CreateModelOptions;
        const field = resolved.subModels?.field;
        if (!isCreateModelOptions(field)) {
          return resolved;
        }
        const fieldStepParams = field.stepParams || {};
        return {
          ...resolved,
          subModels: {
            ...resolved.subModels,
            field: {
              ...field,
              stepParams: {
                ...fieldStepParams,
                jsSettings: {
                  ...fieldStepParams.jsSettings,
                  runJs,
                },
              },
            },
          },
        };
      };
    }
    return next;
  });
}

function createEntryModelOptions(
  entry: LightExtensionSelectableEntrySummary,
  runJs: ReturnType<typeof createRunJs>,
  options: LightExtensionModelMenuOptions,
  modelUse: string,
) {
  if (options.target === 'action') {
    return {
      use: modelUse,
      stepParams: { clickSettings: { runJs } },
    };
  }
  if (options.target === 'column') {
    return {
      use: modelUse,
      stepParams: {
        tableColumnSettings: { title: { title: getEntryLabel(entry) } },
        jsSettings: { runJs },
      },
    };
  }
  return {
    use: modelUse,
    stepParams: { jsSettings: { runJs } },
  };
}

function getModelUse(options: LightExtensionModelMenuOptions): string {
  if (options.target === 'field') {
    throw new Error('modelUse is not available for Light extension field menus');
  }
  const modelUse = options.modelUse || defaultModelUses[options.target];
  if (!modelUse) {
    throw new Error(`modelUse is required for Light extension ${options.target} menus`);
  }
  return modelUse;
}

function createRuntimeSourceBinding(
  entry: LightExtensionSelectableEntrySummary,
  repoLabel: string,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: entry.repoId,
    repoTitle: repoLabel,
    entryId: entry.id,
    entryTitle: getEntryLabel(entry),
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind: entry.kind,
  };
}

function getRepoLabel(repo: LightExtensionRepoRecord): string {
  return repo.title?.trim() || repo.name?.trim() || repo.id;
}

function getEntryLabel(entry: LightExtensionSelectableEntrySummary): string {
  return entry.title?.trim() || entry.entryName || entry.id;
}

function resolveSurfaceMenuOptions(
  context: RunJSSurfaceMenuItemProviderContext,
): LightExtensionModelMenuOptions | null {
  if (context.surface === 'block') {
    return { target: 'block' };
  }
  if (context.surface === 'action') {
    const modelUse = ACTION_MODEL_USES.find((candidate) => containsModelUse(context.items, candidate));
    return modelUse ? { target: 'action', modelUse } : null;
  }
  return FIELD_SURFACE_OPTIONS[context.surface] || null;
}

function containsModelUse(items: SubModelItem[], expected: string): boolean {
  return items.some((item) => {
    if (item.useModel === expected) {
      return true;
    }
    return Array.isArray(item.children) ? containsModelUse(item.children, expected) : false;
  });
}

function translate(ctx: FlowModelContext, key: string): string {
  return ctx.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}

function isCreateModelOptions(value: unknown): value is CreateModelOptions {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && 'use' in value;
}
