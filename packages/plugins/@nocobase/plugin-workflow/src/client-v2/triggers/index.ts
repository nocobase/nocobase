/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The workflow trigger extension contract, relocated to client-v2 so one definition can progressively serve both
 * canvases. It mirrors `canvas/Instruction.ts`: legacy Formily artifacts stay as pass-through data, while modern
 * surfaces are lazy loaders. A v1 trigger can `extends` its v2 counterpart and drop legacy artifacts one surface at a
 * time, making v1 fall through to the inherited loaders.
 */

import type { ComponentType } from 'react';
import type { ISchema, JSXComponent } from '@formily/react';
import type { SubModelItem } from '@nocobase/flow-engine';
import type { UseVariableOptions, VariableOption } from '../canvas/collectionFieldOptions';

export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;

export type TriggerTempAssociationSource = {
  collection: string;
  nodeId: string | number;
  nodeKey: string;
  nodeType: 'workflow';
};

export abstract class Trigger {
  title: string;
  description?: string;
  sync?: boolean;

  // Legacy config UI (Formily). The modern canvas never interprets these fields; they are consumed only by legacy
  // callers until a trigger drops them and falls through to the matching loader.
  presetFieldset?: Record<string, ISchema>;
  fieldset?: Record<string, ISchema>;
  triggerFieldset?: Record<string, ISchema>;
  view?: ISchema;
  scope?: Record<string, unknown>;
  components?: Record<string, JSXComponent>;
  initializers?: unknown;
  isActionTriggerable_deprecated?: boolean | ((config: object, context?: object) => boolean);

  // Modern trigger extension points. Naming intentionally matches Instruction's `*Loader` convention.
  PresetFieldsetLoader?: LoaderOf;
  FieldsetLoader?: LoaderOf;
  TriggerFieldsetLoader?: LoaderOf;

  createDefaultConfig?(): Record<string, unknown> {
    return {};
  }

  validate(config: Record<string, unknown>): boolean {
    return true;
  }

  useVariables?(config: Record<string, unknown>, options?: UseVariableOptions): VariableOption[] | null;

  /** Legacy schema initializer counterpart. Kept structural to avoid importing `@nocobase/client` into client-v2. */
  useInitializers?(config: Record<string, unknown>): unknown | null;

  /** v2-native block-creation menu item (the `useInitializers` counterpart). */
  getCreateModelMenuItem?(args: {
    config: Record<string, unknown>;
    workflow?: unknown;
    nodeType?: string;
  }): SubModelItem | SubModelItem[] | null;

  useTempAssociationSource?(
    config: Record<string, unknown>,
    workflow?: { id?: string | number },
  ): TriggerTempAssociationSource | null;
}

function hasSchemaEntries(schema: unknown): boolean {
  return typeof schema === 'object' && schema !== null && Object.keys(schema as object).length > 0;
}

export type LegacyTriggerFieldsetRenderMode = 'legacy-fieldset' | 'modern-loader' | 'none';

function resolveFieldsetMode(schema: unknown, loader: unknown): LegacyTriggerFieldsetRenderMode {
  if (hasSchemaEntries(schema)) {
    return 'legacy-fieldset';
  }
  if (typeof loader === 'function') {
    return 'modern-loader';
  }
  return 'none';
}

export function resolveLegacyTriggerPresetRenderMode(
  trigger?: Pick<Trigger, 'presetFieldset' | 'PresetFieldsetLoader'> | null,
) {
  return resolveFieldsetMode(trigger?.presetFieldset, trigger?.PresetFieldsetLoader);
}

export function resolveLegacyTriggerConfigRenderMode(trigger?: Pick<Trigger, 'fieldset' | 'FieldsetLoader'> | null) {
  return resolveFieldsetMode(trigger?.fieldset, trigger?.FieldsetLoader);
}

export function resolveLegacyTriggerExecuteRenderMode(
  trigger?: Pick<Trigger, 'triggerFieldset' | 'TriggerFieldsetLoader'> | null,
) {
  return resolveFieldsetMode(trigger?.triggerFieldset, trigger?.TriggerFieldsetLoader);
}
