/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { StepCascadeMenuUIMode } from '@nocobase/flow-engine';
import React from 'react';

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

  const repoLabel =
    toNonEmptyString(sourceBinding.repoName) ||
    toNonEmptyString(sourceBinding.repoTitle) ||
    toNonEmptyString(sourceBinding.repoId);
  const entryLabel =
    toNonEmptyString(sourceBinding.entryName) ||
    toNonEmptyString(sourceBinding.entryTitle) ||
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

function RunJSSourceBindingDisplayLabel(props: {
  fallback?: string;
  input: RunJSSourceMenuInput;
  t: RunJSSourceMenuInput['t'];
}) {
  const { fallback, input, t = (key) => key } = props;
  const sourceBindingKey = JSON.stringify(input.sourceBinding || null);
  const settingsKey = JSON.stringify(input.settings || {});
  const [label, setLabel] = React.useState(fallback);

  React.useEffect(() => {
    setLabel(fallback);
    const resolver = RunJSSourceResolverRegistry.getResolver(input.sourceMode);
    if (typeof resolver?.getBindingTitle !== 'function' || sourceBindingKey === 'null') {
      return;
    }

    let active = true;
    const sourceBinding = JSON.parse(sourceBindingKey) as RunJSSourceBinding;
    const settings = JSON.parse(settingsKey) as RunJSSourceSettings;
    Promise.resolve()
      .then(() =>
        resolver.getBindingTitle({
          sourceMode: input.sourceMode,
          sourceBinding,
          settings,
        }),
      )
      .then((resolvedLabel) => {
        const nextLabel = toNonEmptyString(resolvedLabel);
        if (active && nextLabel) {
          setLabel(nextLabel);
        }
      })
      .catch((error: unknown) => {
        console.warn('[NocoBase] Failed to resolve RunJS source binding display label:', error);
      });

    return () => {
      active = false;
    };
  }, [fallback, input.sourceMode, settingsKey, sourceBindingKey]);

  return label || t('Light extension');
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

export async function loadRunJSSourceMenuItems(input: RunJSSourceMenuInput): Promise<RunJSSourceMenuItem[]> {
  const sourceItems = await Promise.all(
    RunJSSourceResolverRegistry.getResolvers()
      .filter((resolver) => typeof resolver.listSourceMenuItems === 'function')
      .map((resolver) => resolver.listSourceMenuItems?.(input) || []),
  );

  return sourceItems.flat();
}

export function shouldHideRunJSSourceMenu(): boolean {
  return !RunJSSourceResolverRegistry.getResolvers().some(
    (resolver) => typeof resolver.listSourceMenuItems === 'function',
  );
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
        const input = getMenuInput(displayParams, options, t);
        return React.createElement(RunJSSourceBindingDisplayLabel, {
          fallback: getSourceBindingLabel(displayParams.sourceBinding),
          input,
          t,
        });
      },
      async loadItems({ params, defaultParams, t }): Promise<RunJSSourceMenuItem[]> {
        const input = getMenuInput(params, options, t);
        const inlineSelected = normalizeSourceMode(params.sourceMode) === INLINE_RUNJS_SOURCE_MODE;
        const sourceItems = await loadRunJSSourceMenuItems(input);

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
                settings: cloneRecord(params.settings),
              };
            },
          },
          ...sourceItems,
        ];
      },
    },
  };
}
