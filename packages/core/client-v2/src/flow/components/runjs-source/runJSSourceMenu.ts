/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { StepCascadeMenuUIMode } from '@nocobase/flow-engine';

import type { RunJSSourceBinding, RunJSSourceMenuInput, RunJSSourceMenuItem, RunJSSourceSettings } from './types';
import { INLINE_RUNJS_SOURCE_MODE } from './types';
import { RunJSSourceResolverRegistry } from './RunJSSourceResolverRegistry';

export interface RunJSSourceCascadeMenuOptions {
  kind: string;
  sourceFlowKey?: string;
}

type SourceMenuParams = {
  sourceMode?: unknown;
  sourceBinding?: unknown;
  settings?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function getSourceBindingLabel(sourceBinding: unknown): string | undefined {
  if (!isRecord(sourceBinding)) {
    return undefined;
  }

  const repoLabel = toNonEmptyString(sourceBinding.repoTitle) || toNonEmptyString(sourceBinding.repoId);
  const entryLabel =
    toNonEmptyString(sourceBinding.entryTitle) ||
    toNonEmptyString(sourceBinding.entryName) ||
    toNonEmptyString(sourceBinding.entryId);

  if (repoLabel && entryLabel) {
    return `${repoLabel} / ${entryLabel}`;
  }

  return entryLabel || repoLabel;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeSourceMode(value: unknown): string {
  return value === 'light-extension' ? 'light-extension' : INLINE_RUNJS_SOURCE_MODE;
}

function getMenuInput(
  params: SourceMenuParams,
  options: RunJSSourceCascadeMenuOptions,
  t: RunJSSourceMenuInput['t'],
): RunJSSourceMenuInput {
  return {
    sourceMode: normalizeSourceMode(params.sourceMode),
    sourceBinding: isRecord(params.sourceBinding) ? (params.sourceBinding as RunJSSourceBinding) : undefined,
    settings: cloneRecord(params.settings) as RunJSSourceSettings,
    kind: options.kind,
    t,
  };
}

export function createRunJSSourceCascadeMenuUIMode(options: RunJSSourceCascadeMenuOptions): StepCascadeMenuUIMode {
  return {
    type: 'cascadeMenu' as const,
    key: 'sourceMode',
    props: {
      searchPlaceholder: 'Search light extensions',
      loadingLabel: 'Loading light extensions',
      emptyLabel: 'No light extension entries',
      errorLabel: 'Failed to load light extensions',
      getDisplayLabel({ model, flowKey, params, t }) {
        const runJsParams = model?.getStepParams(options.sourceFlowKey || flowKey || '', 'runJs');
        const displayParams = params.sourceMode ? params : isRecord(runJsParams) ? runJsParams : params;
        const sourceMode = normalizeSourceMode(displayParams.sourceMode);
        if (sourceMode === INLINE_RUNJS_SOURCE_MODE) {
          return t('Inline code');
        }
        return getSourceBindingLabel(displayParams.sourceBinding) || t('Light extension');
      },
      async loadItems({ params, defaultParams, t }): Promise<RunJSSourceMenuItem[]> {
        const input = getMenuInput(params, options, t);
        const inlineSelected = normalizeSourceMode(params.sourceMode) === INLINE_RUNJS_SOURCE_MODE;
        const sourceItems = await Promise.all(
          RunJSSourceResolverRegistry.getResolvers()
            .filter((resolver) => typeof resolver.listSourceMenuItems === 'function')
            .map((resolver) => resolver.listSourceMenuItems?.(input) || []),
        );

        return [
          {
            key: INLINE_RUNJS_SOURCE_MODE,
            label: t('Inline code'),
            searchText: t('Inline code'),
            selected: inlineSelected,
            onSelect() {
              return {
                ...defaultParams,
                ...params,
                sourceMode: INLINE_RUNJS_SOURCE_MODE,
                sourceBinding: undefined,
                settings: {},
              };
            },
          },
          ...sourceItems.flat(),
        ];
      },
    },
  };
}
