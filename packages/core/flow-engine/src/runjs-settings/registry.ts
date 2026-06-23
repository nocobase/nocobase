/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSSettingsSchema } from './normalize';
import type {
  RuntimeSettingsEvaluateInput,
  RuntimeSettingsEvaluateResult,
  RuntimeSettingsRegistryEntry,
  RuntimeSettingsRunMeta,
  RunJSSettingsJSONValue,
  RunJSSettingsKey,
  RunJSSettingsModelLike,
  SettingsFactoryContext,
  UseSettingsInput,
} from './types';

function hashCode(code: string): string {
  let hash = 5381;
  for (let index = 0; index < code.length; index += 1) {
    hash = (hash * 33) ^ code.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function entryKey(modelUid: string, settingsKey: RunJSSettingsKey) {
  return `${modelUid}:${settingsKey}`;
}

function buildFactoryContext(
  model: RunJSSettingsModelLike,
  values: Record<string, RunJSSettingsJSONValue>,
  draftValues?: Record<string, RunJSSettingsJSONValue>,
): SettingsFactoryContext {
  const contextWithPageInfo = model.context as ({ pageInfo?: unknown } & typeof model.context) | undefined;
  return {
    locale: model.context?.locale,
    t: model.context?.t,
    model: {
      uid: model.uid,
      use: model.use,
      pageInfo: contextWithPageInfo?.pageInfo,
    },
    dataSourceManager: model.context?.dataSourceManager,
    getConfigValue(name: string) {
      if (draftValues && Object.prototype.hasOwnProperty.call(draftValues, name)) {
        return draftValues[name];
      }
      return values[name];
    },
  };
}

export class RuntimeSettingsRegistry {
  private entries = new Map<string, RuntimeSettingsRegistryEntry>();
  private runs = new Map<string, RuntimeSettingsRunMeta>();
  private runSeq = 0;

  beginRun(model: RunJSSettingsModelLike, code: string): RuntimeSettingsRunMeta {
    const run: RuntimeSettingsRunMeta = {
      modelUid: model.uid,
      modelUse: model.use || '',
      runId: (this.runSeq += 1),
      codeHash: hashCode(String(code ?? '')),
    };
    this.runs.set(model.uid, run);
    this.clear(model, 'default');
    return run;
  }

  getCurrentRun(model: RunJSSettingsModelLike): RuntimeSettingsRunMeta | undefined {
    return this.runs.get(model.uid);
  }

  ensureRun(model: RunJSSettingsModelLike): RuntimeSettingsRunMeta {
    return this.getCurrentRun(model) || this.beginRun(model, '');
  }

  endRun(model: RunJSSettingsModelLike, runId: number, result?: { error?: unknown }) {
    const current = this.runs.get(model.uid);
    if (!current || current.runId !== runId) {
      return;
    }
    const entry = this.get(model, 'default');
    if (!entry && result?.error) {
      this.clear(model, 'default');
    }
  }

  register(
    model: RunJSSettingsModelLike,
    settingsKey: RunJSSettingsKey,
    schemaOrFactory: UseSettingsInput,
    meta?: Partial<RuntimeSettingsRunMeta>,
  ): RuntimeSettingsRegistryEntry {
    const run = this.ensureRun(model);
    const existing = this.get(model, settingsKey);
    if (existing && existing.runId === (meta?.runId ?? run.runId) && process.env.NODE_ENV !== 'production') {
      console.warn(
        `ctx.useSettings('${settingsKey}') was called more than once in the same JS run; the last schema wins.`,
      );
    }
    const entry: RuntimeSettingsRegistryEntry = {
      modelUid: model.uid,
      modelUse: model.use || '',
      settingsKey,
      schemaOrFactory,
      runId: meta?.runId ?? run.runId,
      codeHash: meta?.codeHash ?? run.codeHash,
      registeredAt: Date.now(),
      status: 'current',
    };
    this.entries.set(entryKey(model.uid, settingsKey), entry);
    return entry;
  }

  registerError(
    model: RunJSSettingsModelLike,
    settingsKey: RunJSSettingsKey,
    error: unknown,
    meta?: Partial<RuntimeSettingsRunMeta>,
  ): RuntimeSettingsRegistryEntry {
    const run = this.ensureRun(model);
    const entry: RuntimeSettingsRegistryEntry = {
      modelUid: model.uid,
      modelUse: model.use || '',
      settingsKey,
      lastError: toError(error),
      runId: meta?.runId ?? run.runId,
      codeHash: meta?.codeHash ?? run.codeHash,
      registeredAt: Date.now(),
      status: 'error',
    };
    this.entries.set(entryKey(model.uid, settingsKey), entry);
    return entry;
  }

  get(model: RunJSSettingsModelLike, settingsKey: RunJSSettingsKey): RuntimeSettingsRegistryEntry | undefined {
    const entry = this.entries.get(entryKey(model.uid, settingsKey));
    const run = this.runs.get(model.uid);
    if (!entry || !run || entry.runId !== run.runId || entry.codeHash !== run.codeHash) {
      return undefined;
    }
    return entry;
  }

  evaluate(
    model: RunJSSettingsModelLike,
    settingsKey: RunJSSettingsKey,
    input: RuntimeSettingsEvaluateInput,
  ): RuntimeSettingsEvaluateResult {
    const entry = this.get(model, settingsKey);
    if (!entry?.schemaOrFactory) {
      const error = entry?.lastError || new Error('RunJS settings schema is not available');
      return { error };
    }
    try {
      const rawSchema =
        typeof entry.schemaOrFactory === 'function'
          ? entry.schemaOrFactory({
              ctx: input.ctx || buildFactoryContext(model, input.values, input.draftValues),
              values: input.values,
              draftValues: input.draftValues,
              phase: input.phase,
            })
          : entry.schemaOrFactory;
      if (isPromiseLike(rawSchema)) {
        throw new Error('async settings factory is not supported in MVP');
      }
      const schema = normalizeRunJSSettingsSchema(rawSchema);
      entry.lastSchema = schema;
      entry.lastError = undefined;
      entry.status = 'current';
      return { schema };
    } catch (error) {
      const normalizedError = toError(error);
      entry.lastError = normalizedError;
      entry.status = 'error';
      if (input.phase === 'settings-draft' && entry.lastSchema) {
        return { schema: entry.lastSchema, error: normalizedError };
      }
      return { error: normalizedError };
    }
  }

  clear(model: RunJSSettingsModelLike, settingsKey: RunJSSettingsKey) {
    this.entries.delete(entryKey(model.uid, settingsKey));
  }

  clearModel(modelUid: string) {
    for (const key of Array.from(this.entries.keys())) {
      if (key.startsWith(`${modelUid}:`)) {
        this.entries.delete(key);
      }
    }
    this.runs.delete(modelUid);
  }
}

export const runtimeSettingsRegistry = new RuntimeSettingsRegistry();
