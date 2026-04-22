/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as p from '@clack/prompts';
import { exit, stdin as stdinStream, stdout as stdoutStream } from 'node:process';

export type PromptValue = string | number | boolean;

/** Values collected from earlier catalog entries (same iteration order). Missing keys were skipped or not yet reached. */
export type PromptCatalogValues = Readonly<Partial<Record<string, PromptValue>>>;

/** When true, this block is skipped: no UI, no result key. Prior keys only are passed in `values`. */
export type PromptHiddenPredicate = (values: PromptCatalogValues) => boolean;

/** For **`type: 'run'`** only: when true, **`run`** executes. If omitted, the block always runs. */
export type PromptWhenPredicate = (values: PromptCatalogValues) => boolean;

/** Select value, or value plus Clack `label` / `hint`. */
export type SelectOptionDef = string | { value: string; label?: string; hint?: string };

export function selectOptionValues(options: SelectOptionDef[]): string[] {
  return options.map((o) => (typeof o === 'string' ? o : o.value));
}

function clackSelectOptions(options: SelectOptionDef[]) {
  return options.map((o) =>
    typeof o === 'string'
      ? { value: o, label: o }
      : { value: o.value, label: o.label ?? o.value, ...(o.hint !== undefined ? { hint: o.hint } : {}) },
  );
}

export type IntroPromptBlock = {
  type: 'intro';
  title: string;
  hidden?: PromptHiddenPredicate;
};
export type OutroPromptBlock = {
  type: 'outro';
  message: string;
  hidden?: PromptHiddenPredicate;
};
export type TextPromptBlock = {
  type: 'text';
  message: string;
  hidden?: PromptHiddenPredicate;
  /** Shown when the line is empty (Clack `text` placeholder). */
  placeholder?: string;
  initialValue?: string;
  /** Default when `yes: true` and the key is not set in merged initial values (after `yesInitialValues`). */
  yesInitialValue?: string;
  /** When true, value must be non-empty (after trim). */
  required?: boolean;
};
export type BooleanPromptBlock = {
  type: 'boolean';
  message: string;
  hidden?: PromptHiddenPredicate;
  initialValue?: boolean;
  yesInitialValue?: boolean;
};
export type SelectPromptBlock = {
  type: 'select';
  message: string;
  hidden?: PromptHiddenPredicate;
  options: SelectOptionDef[];
  /** Default option when merging defaults and for non-interactive fallback */
  initialValue?: string;
  /** Default when `yes: true` and the key is not in merged initial values; must be in `options`. */
  yesInitialValue?: string;
  /** When true, a valid option must be resolved (non-interactive needs `initialValues` / defaults). */
  required?: boolean;
};
export type PasswordPromptBlock = {
  type: 'password';
  message: string;
  hidden?: PromptHiddenPredicate;
  /** Default when `yes: true` and `initialValues` / `yesInitialValues` do not set this key. */
  yesInitialValue?: string;
  required?: boolean;
};
export type IntegerPromptBlock = {
  type: 'integer';
  message: string;
  hidden?: PromptHiddenPredicate;
  /** Shown when the line is empty (integer prompt uses Clack `text` under the hood). */
  placeholder?: string;
  initialValue?: number;
  yesInitialValue?: number;
  /** When true, a number must be provided (non-empty interactive input or preset). */
  required?: boolean;
};

/**
 * Imperative step: no prompt and no result key. Use optional **`when`** for “only when …” (positive condition).
 * Prefer keeping **`run`** small (log, validate, prefetch); heavy logic belongs outside the catalog.
 */
export type RunPromptBlock = {
  type: 'run';
  when?: PromptWhenPredicate;
  /**
   * Second argument is **`command`** from {@link RunPromptCatalogOptions} (e.g. oclif `this`), if provided.
   */
  run: (values: PromptCatalogValues, command?: unknown) => void | Promise<void>;
};

export type PromptBlock =
  | IntroPromptBlock
  | OutroPromptBlock
  | TextPromptBlock
  | BooleanPromptBlock
  | SelectPromptBlock
  | PasswordPromptBlock
  | IntegerPromptBlock
  | RunPromptBlock;

export type PromptsCatalog = Record<string, PromptBlock>;

export type PromptInitialValues = Partial<Record<string, PromptValue>>;

export type RunPromptCatalogHooks = {
  onCancel: () => never;
  onMissingNonInteractive: (message: string) => never;
};

export type RunPromptCatalogOptions = {
  /** Merged with each block’s `initialValue` to form defaults (prompt UI + non-interactive prefill). */
  initialValues?: PromptInitialValues;
  /**
   * Preset answers: if a **value** key matches this catalog entry’s key, that step is skipped (no Clack UI)
   * and **`values[key]`** is written to the result after validation. Does not apply to **`intro` / `outro` / `run`**.
   */
  values?: PromptInitialValues;
  /**
   * When **`yes`** is true, merged on top of **`initialValues`** for resolve-only paths (overrides same keys).
   * Per-block **`yesInitialValue`** still applies when the key is absent after this merge.
   */
  yesInitialValues?: PromptInitialValues;
  /**
   * When true (e.g. CLI `--yes` / `-y`), skip all input prompts even on a TTY: use the same
   * merge rules as non-interactive (`initialValues` + optional `yesInitialValues` + catalog defaults / `yesInitialValue`). **`required`**
   * fields must still be satisfiable from those defaults.
   */
  yes?: boolean;
  /**
   * Optional overrides. Defaults: cancel → `p.cancel` + exit 0;
   * missing value in non-interactive mode → print message to stderr + exit 1.
   */
  hooks?: Partial<RunPromptCatalogHooks>;
  /** Passed as the second argument to each **`type: 'run'`** `run(values, command)` (e.g. oclif command `this`). */
  command?: unknown;
};

function defaultOnCancel(): never {
  p.cancel('Cancelled.');
  exit(0);
}

function defaultOnMissingNonInteractive(message: string): never {
  console.error(message);
  exit(1);
}

function hasIvKey(iv: PromptInitialValues, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(iv, key) && iv[key] !== undefined && iv[key] !== null
  );
}

/** `useYesInitial`: when true (resolve under `yes`), use block `yesInitialValue` before catalog `initialValue`. */
function mergedText(key: string, def: TextPromptBlock, iv: PromptInitialValues, useYesInitial: boolean): string {
  if (hasIvKey(iv, key)) {
    return String(iv[key]);
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  return def.initialValue ?? '';
}

function mergedBoolean(key: string, def: BooleanPromptBlock, iv: PromptInitialValues, useYesInitial: boolean): boolean {
  if (hasIvKey(iv, key)) {
    return Boolean(iv[key]);
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  return def.initialValue ?? true;
}

function mergedSelect(
  key: string,
  def: SelectPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
): string | undefined {
  const valueList = selectOptionValues(def.options);
  if (hasIvKey(iv, key)) {
    const s = String(iv[key]);
    if (valueList.includes(s)) {
      return s;
    }
    return undefined;
  }
  if (useYesInitial && def.yesInitialValue !== undefined && valueList.includes(def.yesInitialValue)) {
    return def.yesInitialValue;
  }
  const d = def.initialValue;
  if (d !== undefined && valueList.includes(d)) {
    return d;
  }
  return valueList[0];
}

function mergedInteger(
  key: string,
  def: IntegerPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
): number | undefined {
  if (hasIvKey(iv, key)) {
    const v = iv[key];
    return typeof v === 'number' ? v : Number.parseInt(String(v), 10);
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  return def.initialValue;
}

function isBlankText(value: string): boolean {
  return value.trim() === '';
}

function shouldSkipBlock(def: PromptBlock, values: PromptCatalogValues): boolean {
  if (def.type === 'run') {
    return def.when !== undefined && !def.when(values);
  }
  return def.hidden !== undefined && def.hidden(values);
}

/**
 * If **`preset`** defines **`key`**, validate and set **`out[key]`**, return **`true`** (caller should `continue`).
 * No-op for non-input block types.
 */
function tryApplyPreset(
  key: string,
  def: PromptBlock,
  preset: PromptInitialValues,
  out: Record<string, PromptValue>,
  hooks: RunPromptCatalogHooks,
): boolean {
  if (!hasIvKey(preset, key)) {
    return false;
  }
  const raw = preset[key];

  switch (def.type) {
    case 'intro':
    case 'outro':
    case 'run':
      return false;
    case 'text': {
      const s = String(raw ?? '');
      if (def.required && isBlankText(s)) {
        hooks.onMissingNonInteractive(
          `"${key}" is required; set a non-empty values.${key} or omit it to prompt.`,
        );
      }
      out[key] = s;
      return true;
    }
    case 'boolean': {
      out[key] = Boolean(raw);
      return true;
    }
    case 'select': {
      const valueList = selectOptionValues(def.options);
      const s = String(raw ?? '');
      if (!valueList.includes(s)) {
        hooks.onMissingNonInteractive(
          `Invalid values.${key}: "${s}". Expected one of: ${valueList.join(', ')}`,
        );
      }
      out[key] = s;
      return true;
    }
    case 'password': {
      const s = String(raw ?? '');
      if (def.required && isBlankText(s)) {
        hooks.onMissingNonInteractive(
          `"${key}" is required; set a non-empty values.${key} or omit it to prompt.`,
        );
      }
      out[key] = s;
      return true;
    }
    case 'integer': {
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        out[key] = raw;
        return true;
      }
      const s = String(raw ?? '').trim();
      if (s === '') {
        if (def.required) {
          hooks.onMissingNonInteractive(
            `"${key}" is required; set values.${key} or omit it to prompt.`,
          );
        }
        out[key] = def.initialValue ?? 0;
        return true;
      }
      if (!/^-?\d+$/.test(s)) {
        hooks.onMissingNonInteractive(`Invalid values.${key}: must be an integer.`);
      }
      out[key] = Number.parseInt(s, 10);
      return true;
    }
  }
}

/**
 * Run a declarative catalog with @clack/prompts. No oclif / argv dependency.
 *
 * **Interactive** when stdin and stdout are both TTYs **and** `yes` is not set; otherwise values are taken from defaults only (no prompts). Use **`yes: true`** for a TTY session that should still accept defaults without prompting (same as CI / piped stdin).
 *
 * **`intro` / `outro`** steps call Clack `intro` / `outro` and do not write to the result object.
 *
 * Defaults are **`initialValues[key] ?? catalog block initialValue`** (per type).  
 * With **`yes: true`**, resolve uses **`{ ...initialValues, ...yesInitialValues }`** then optional per-block **`yesInitialValue`**, then **`initialValue`**.  
 * **`values`:** preset result keys — matching steps are skipped (no UI); **`initialValues`** still prefill when a step is shown.  
 * **Interactive:** prompts when the key is not set in **`values`**; prefill from **`initialValues`** + catalog **`initialValue`** (not `yes*` fields).  
 * **Non-interactive or `yes`:** uses **`values`** first, else merged defaults (no prompts).  
 * **`text`** and **`integer`** blocks may set **`placeholder`** (Clack hint when the line is empty; interactive only).  
 * Any block may set **`hidden: (values) => boolean`** using **`PromptCatalogValues`** so far; when true, the step is skipped (no **`out`** key, no **`intro`/`outro`** line).  
 * **`type: 'run'`** runs **`run(values, command?)`** (sync or async) with no UI and no **`out`** entry; optional **`when`** runs only when it returns true. Pass **`command`** (e.g. oclif `this`) in options when handlers need it.  
 * Blocks may set **`required`** (text / password / integer / select): empty or missing values then fail validation or `onMissingNonInteractive`.
 */
export async function runPromptCatalog(
  catalog: PromptsCatalog,
  options: RunPromptCatalogOptions = {},
): Promise<Record<string, PromptValue>> {
  const promptIv = options.initialValues ?? {};
  const yesIv = options.yesInitialValues ?? {};
  const resolveIv: PromptInitialValues = options.yes ? { ...promptIv, ...yesIv } : promptIv;
  const useYesInitial = Boolean(options.yes);
  const hooks: RunPromptCatalogHooks = {
    onCancel: options.hooks?.onCancel ?? defaultOnCancel,
    onMissingNonInteractive: options.hooks?.onMissingNonInteractive ?? defaultOnMissingNonInteractive,
  };
  const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !options.yes);
  const preset = options.values ?? {};
  const out: Record<string, PromptValue> = {};

  for (const [key, def] of Object.entries(catalog)) {
    if (shouldSkipBlock(def, out)) {
      continue;
    }

    if (tryApplyPreset(key, def, preset, out, hooks)) {
      continue;
    }

    if (def.type === 'intro') {
      p.intro(def.title);
      continue;
    }

    if (def.type === 'outro') {
      p.outro(def.message);
      continue;
    }

    if (def.type === 'run') {
      await def.run(out, options.command);
      continue;
    }

    if (def.type === 'text') {
      if (!interactive) {
        const merged = mergedText(key, def, resolveIv, useYesInitial);
        if (def.required && isBlankText(merged)) {
          hooks.onMissingNonInteractive(
            `Non-interactive: "${key}" is required; set initialValues.${key}, yesInitialValues.${key}, yesInitialValue on the block, or initialValue.`,
          );
        }
        out[key] = merged;
        continue;
      }
      const merged = mergedText(key, def, promptIv, false);
      const raw = await p.text({
        message: def.message,
        initialValue: merged,
        ...(def.placeholder !== undefined ? { placeholder: def.placeholder } : {}),
        validate: def.required ? (value) => (isBlankText(value) ? 'Required' : undefined) : undefined,
      });
      if (p.isCancel(raw)) {
        hooks.onCancel();
      }
      out[key] = typeof raw === 'string' ? raw : merged;
      continue;
    }

    if (def.type === 'boolean') {
      if (!interactive) {
        out[key] = mergedBoolean(key, def, resolveIv, useYesInitial);
        continue;
      }
      const merged = mergedBoolean(key, def, promptIv, false);
      const raw = await p.confirm({
        message: def.message,
        initialValue: merged,
      });
      if (p.isCancel(raw)) {
        hooks.onCancel();
      }
      out[key] = Boolean(raw);
      continue;
    }

    if (def.type === 'select') {
      const valueList = selectOptionValues(def.options);
      if (def.required && def.options.length === 0) {
        hooks.onMissingNonInteractive(`Select "${key}" is required but has no options.`);
      }
      if (!interactive) {
        const merged = mergedSelect(key, def, resolveIv, useYesInitial);
        if (merged === undefined || !valueList.includes(merged)) {
          const bad =
            hasIvKey(resolveIv, key) && !valueList.includes(String(resolveIv[key]))
              ? String(resolveIv[key])
              : hasIvKey(promptIv, key) && !valueList.includes(String(promptIv[key]))
                ? String(promptIv[key])
                : undefined;
          hooks.onMissingNonInteractive(
            bad !== undefined
              ? `Invalid value for ${key}: ${bad}. Expected one of: ${valueList.join(', ')}`
              : `Non-interactive: set initialValues.${key}, yesInitialValues.${key}, or select.initialValue / yesInitialValue / options on the catalog block.`,
          );
        }
        out[key] = merged;
        continue;
      }
      const merged = mergedSelect(key, def, promptIv, false);
      const uiInitial =
        merged ??
        (def.initialValue && valueList.includes(def.initialValue) ? def.initialValue : undefined) ??
        valueList[0];
      if (uiInitial === undefined || !valueList.includes(uiInitial)) {
        const hint = def.required
          ? `Select "${key}" is required; set initialValues.${key} or select.initialValue / options on the catalog block.`
          : `Select "${key}" has no valid default; set initialValues.${key} or options on the catalog block.`;
        hooks.onMissingNonInteractive(hint);
      }
      const raw = await p.select<string>({
        message: def.message,
        options: clackSelectOptions(def.options),
        initialValue: uiInitial,
      });
      if (p.isCancel(raw)) {
        hooks.onCancel();
      }
      out[key] = raw as string;
      continue;
    }

    if (def.type === 'password') {
      if (!interactive) {
        const hasR = hasIvKey(resolveIv, key);
        let merged: string | undefined = hasR ? String(resolveIv[key] ?? '') : undefined;
        if (merged === undefined && useYesInitial && def.yesInitialValue !== undefined) {
          merged = def.yesInitialValue;
        }
        if (merged === undefined) {
          if (def.required) {
            hooks.onMissingNonInteractive(
              `Non-interactive: "${key}" is required; set initialValues.${key}, yesInitialValues.${key}, or yesInitialValue on the block.`,
            );
          }
          out[key] = '';
          continue;
        }
        if (def.required && isBlankText(merged)) {
          hooks.onMissingNonInteractive(
            `Non-interactive: "${key}" is required; set a non-empty initialValues / yesInitialValues / yesInitialValue.`,
          );
        }
        out[key] = merged;
        continue;
      }
      const raw = await p.password({
        message: def.message,
        validate: def.required ? (value) => (isBlankText(value) ? 'Required' : undefined) : undefined,
      });
      if (p.isCancel(raw)) {
        hooks.onCancel();
      }
      out[key] = typeof raw === 'string' ? raw : '';
      continue;
    }

    if (def.type === 'integer') {
      if (!interactive) {
        const merged = mergedInteger(key, def, resolveIv, useYesInitial);
        if (merged === undefined) {
          if (def.required) {
            hooks.onMissingNonInteractive(
              `Non-interactive: "${key}" is required; set initialValues.${key}, yesInitialValues.${key}, or initialValue / yesInitialValue on the block.`,
            );
          }
          out[key] = def.initialValue ?? 0;
          continue;
        }
        out[key] = merged;
        continue;
      }
      const merged = mergedInteger(key, def, promptIv, false);
      const lineDefault = merged !== undefined ? String(merged) : String(def.initialValue ?? 0);
      const raw = await p.text({
        message: def.message,
        initialValue: lineDefault,
        ...(def.placeholder !== undefined ? { placeholder: def.placeholder } : {}),
        validate: (value) => {
          const t = value.trim();
          if (t === '') {
            return def.required ? 'Required' : undefined;
          }
          if (!/^-?\d+$/.test(t)) {
            return 'Must be an integer';
          }
          return undefined;
        },
      });
      if (p.isCancel(raw)) {
        hooks.onCancel();
      }
      if (typeof raw === 'string' && raw.trim() === '' && !def.required) {
        out[key] = def.initialValue ?? 0;
        continue;
      }
      out[key] = Number.parseInt(String(raw).trim(), 10);
      continue;
    }
  }

  return out;
}
