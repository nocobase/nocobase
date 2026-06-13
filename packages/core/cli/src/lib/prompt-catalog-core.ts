/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createCliTranslate,
  resolveCliLocale,
  resolveLocalizedText,
  type CliLocale,
  type LocalizedText,
} from './cli-locale.ts';

export type PromptValue = string | number | boolean;

export type PromptCatalogValues = Readonly<Partial<Record<string, PromptValue>>>;

export type PromptFieldValidateFn = (
  value: PromptValue,
  values: PromptCatalogValues,
) => void | string | undefined | Promise<void | string | undefined>;

export type PromptHiddenPredicate = (values: PromptCatalogValues) => boolean;

export type PromptWhenPredicate = (values: PromptCatalogValues) => boolean;

export type SelectOptionDef =
  | string
  | { value: string; label?: LocalizedText; hint?: LocalizedText; disabled?: boolean };

export function selectOptionValues(options: SelectOptionDef[]): string[] {
  return options.map((o) => (typeof o === 'string' ? o : o.value));
}

export function resolvePromptText(
  text: LocalizedText | undefined,
  locale: CliLocale,
  fallback = '',
): string {
  return resolveLocalizedText(text, { locale, fallback });
}

export function enabledSelectOptionValues(options: SelectOptionDef[]): string[] {
  return options
    .filter((o) => typeof o === 'string' || o.disabled !== true)
    .map((o) => (typeof o === 'string' ? o : o.value));
}

export type IntroPromptBlock = {
  type: 'intro';
  title: LocalizedText;
  hidden?: PromptHiddenPredicate;
};

export type OutroPromptBlock = {
  type: 'outro';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
};

export type TextPromptBlock = {
  type: 'text';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
  placeholder?: LocalizedText;
  initialValue?: string | ((values: PromptCatalogValues) => string);
  yesInitialValue?: string;
  required?: boolean;
  validate?: PromptFieldValidateFn;
};

export type BooleanPromptBlock = {
  type: 'boolean';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
  initialValue?: boolean;
  yesInitialValue?: boolean;
  validate?: PromptFieldValidateFn;
};

export type SelectPromptBlock = {
  type: 'select';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
  options: SelectOptionDef[];
  variant?: 'select' | 'radio';
  initialValue?: string;
  yesInitialValue?: string;
  required?: boolean;
  validate?: PromptFieldValidateFn;
};

export type PasswordPromptBlock = {
  type: 'password';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
  mask?: boolean | string;
  initialValue?: string | ((values: PromptCatalogValues) => string);
  yesInitialValue?: string;
  required?: boolean;
  validate?: PromptFieldValidateFn;
};

export type IntegerPromptBlock = {
  type: 'integer';
  message: LocalizedText;
  hidden?: PromptHiddenPredicate;
  placeholder?: LocalizedText;
  initialValue?: number;
  yesInitialValue?: number;
  required?: boolean;
  validate?: PromptFieldValidateFn;
};

export type RunPromptBlock = {
  type: 'run';
  when?: PromptWhenPredicate;
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
  initialValues?: PromptInitialValues;
  values?: PromptInitialValues;
  yesInitialValues?: PromptInitialValues;
  yes?: boolean;
  hooks?: Partial<RunPromptCatalogHooks>;
  command?: unknown;
  locale?: string;
};

export function createPromptCatalogHooks(
  locale: string | undefined,
  overrides?: Partial<RunPromptCatalogHooks>,
  defaults?: RunPromptCatalogHooks,
): RunPromptCatalogHooks {
  return {
    onCancel:
      overrides?.onCancel
      ?? defaults?.onCancel
      ?? (() => {
        throw new Error(createCliTranslate(locale)('promptCatalog.common.cancelled'));
      }),
    onMissingNonInteractive:
      overrides?.onMissingNonInteractive
      ?? defaults?.onMissingNonInteractive
      ?? ((message: string) => {
        throw new Error(message);
      }),
  };
}

export function hasIvKey(iv: PromptInitialValues, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(iv, key) && iv[key] !== undefined && iv[key] !== null
  );
}

export function resolveTextInitial(
  def: TextPromptBlock,
  valuesSoFar: PromptCatalogValues,
): string | undefined {
  const iv = def.initialValue;
  if (typeof iv === 'function') {
    return iv(valuesSoFar);
  }
  return iv;
}

export function mergedText(
  key: string,
  def: TextPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
  valuesSoFar: PromptCatalogValues = {},
): string {
  if (hasIvKey(iv, key)) {
    return String(iv[key]);
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  return resolveTextInitial(def, valuesSoFar) ?? '';
}

export function mergedBoolean(
  key: string,
  def: BooleanPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
): boolean {
  if (hasIvKey(iv, key)) {
    return Boolean(iv[key]);
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  return def.initialValue ?? true;
}

export function mergedSelect(
  key: string,
  def: SelectPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
): string | undefined {
  const enabledValueList = enabledSelectOptionValues(def.options);
  if (hasIvKey(iv, key)) {
    const s = String(iv[key]);
    if (enabledValueList.includes(s)) {
      return s;
    }
    return undefined;
  }
  if (useYesInitial && def.yesInitialValue !== undefined && enabledValueList.includes(def.yesInitialValue)) {
    return def.yesInitialValue;
  }
  const d = def.initialValue;
  if (d !== undefined && enabledValueList.includes(d)) {
    return d;
  }
  return enabledValueList[0];
}

export function mergedInteger(
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

export function mergedPassword(
  key: string,
  def: PasswordPromptBlock,
  iv: PromptInitialValues,
  useYesInitial: boolean,
  valuesSoFar: PromptCatalogValues = {},
): string | undefined {
  if (hasIvKey(iv, key)) {
    return String(iv[key] ?? '');
  }
  if (useYesInitial && def.yesInitialValue !== undefined) {
    return def.yesInitialValue;
  }
  const initialValue = def.initialValue;
  return typeof initialValue === 'function' ? initialValue(valuesSoFar) : initialValue;
}

export function isBlankText(value: string): boolean {
  return value.trim() === '';
}

export async function runPromptFieldValidate(
  def: PromptBlock,
  value: PromptValue,
  values: PromptCatalogValues,
): Promise<string | undefined> {
  if (def.type === 'intro' || def.type === 'outro' || def.type === 'run') {
    return undefined;
  }
  if (!('validate' in def) || def.validate === undefined) {
    return undefined;
  }
  const r = await def.validate(value, values);
  if (r == null || r === '') {
    return undefined;
  }
  return String(r);
}

export function isPromptBlockSkipped(def: PromptBlock, values: PromptCatalogValues): boolean {
  if (def.type === 'run') {
    return def.when !== undefined && !def.when(values);
  }
  return def.hidden !== undefined && def.hidden(values);
}

export function tryApplyPreset(
  key: string,
  def: PromptBlock,
  preset: PromptInitialValues,
  out: Record<string, PromptValue>,
  hooks: RunPromptCatalogHooks,
  locale: CliLocale,
): boolean {
  const t = createCliTranslate(locale);
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
        hooks.onMissingNonInteractive(t('promptCatalog.preset.required', { key }));
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
          t('promptCatalog.preset.invalidSelect', { key, value: s, options: valueList.join(', ') }),
        );
      }
      out[key] = s;
      return true;
    }
    case 'password': {
      const s = String(raw ?? '');
      if (def.required && isBlankText(s)) {
        hooks.onMissingNonInteractive(t('promptCatalog.preset.required', { key }));
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
          hooks.onMissingNonInteractive(t('promptCatalog.preset.required', { key }));
        }
        out[key] = def.initialValue ?? 0;
        return true;
      }
      if (!/^-?\\d+$/.test(s)) {
        hooks.onMissingNonInteractive(t('promptCatalog.preset.invalidInteger', { key }));
      }
      out[key] = Number.parseInt(s, 10);
      return true;
    }
  }
}

export function resolvePromptCatalogLocale(locale?: string): CliLocale {
  return resolveCliLocale(locale);
}
