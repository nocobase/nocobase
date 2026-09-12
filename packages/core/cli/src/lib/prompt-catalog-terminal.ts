/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import pc from 'picocolors';
import { exit, stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { createCliTranslate, type CliLocale } from './cli-locale.ts';
import { confirm, select, input, password } from './inquirer.ts';
import {
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptValue,
  type RunPromptCatalogHooks,
  type RunPromptCatalogOptions,
  type PromptsCatalog,
  createPromptCatalogHooks,
  hasIvKey,
  isBlankText,
  isPromptBlockSkipped,
  mergedBoolean,
  mergedInteger,
  mergedPassword,
  mergedSelect,
  mergedText,
  resolvePromptCatalogLocale,
  resolvePromptText,
  runPromptFieldValidate,
  selectOptionValues,
  tryApplyPreset,
  type SelectOptionDef,
} from './prompt-catalog-core.ts';

function buildPromptComputationSeed(
  catalog: PromptsCatalog,
  initialValues: PromptInitialValues,
): Record<string, PromptValue> {
  const catalogKeys = new Set(Object.keys(catalog));
  const seed: Record<string, PromptValue> = {};

  for (const [key, value] of Object.entries(initialValues)) {
    if (catalogKeys.has(key) || value === undefined || value === null) {
      continue;
    }
    seed[key] = value as PromptValue;
  }

  return seed;
}

type PromptTerminalRenderer = {
  intro(message: string): void;
  outro(message: string): void;
  error(message: string): void;
  text(options: { message: string; initialValue?: string; placeholder?: string; validate?: (value: string) => string | undefined | Promise<string | undefined> }): Promise<unknown>;
  confirm(options: { message: string; initialValue: boolean }): Promise<unknown>;
  select<T extends string>(options: { message: string; options: Array<{ value: T; label: string; hint?: string; disabled?: boolean }>; initialValue?: T }): Promise<unknown>;
  password(options: { message: string; mask?: boolean | string; validate?: (value: string) => string | undefined | Promise<string | undefined> }): Promise<unknown>;
  isCancel(error: unknown): boolean;
};

function adaptInquirerValidate(
  validate?: (value: string) => string | undefined | Promise<string | undefined>,
): ((value: string) => Promise<true | string>) | undefined {
  if (!validate) {
    return undefined;
  }
  return async (value: string) => {
    const result = await validate(value);
    return result === undefined ? true : result;
  };
}

function inquirerSelectOptions(options: SelectOptionDef[], locale: CliLocale) {
  return options.map((o) =>
    typeof o === 'string'
      ? { value: o, label: o }
      : {
        value: o.value,
        label: resolvePromptText(o.label, locale, o.value),
        ...(o.hint !== undefined ? { hint: resolvePromptText(o.hint, locale) } : {}),
        ...(o.disabled !== undefined ? { disabled: o.disabled } : {}),
      },
  );
}

function createInquirerRenderer(): PromptTerminalRenderer {
  return {
    intro(message: string) {
      console.log(message);
    },
    outro(message: string) {
      console.log(message);
    },
    error(message: string) {
      console.error(pc.red(`✖ ${message}`));
    },
    text(options) {
      return input({
        message: options.message,
        default: options.initialValue,
        placeholder: options.placeholder,
        validate: adaptInquirerValidate(options.validate),
      });
    },
    confirm(options) {
      return confirm({
        message: options.message,
        default: options.initialValue,
      });
    },
    select<T extends string>(options: { message: string; options: Array<{ value: T; label: string; hint?: string; disabled?: boolean }>; initialValue?: T }) {
      return select<T>({
        message: options.message,
        choices: options.options.map((option) => ({
          value: option.value,
          name: option.label,
          ...(option.hint !== undefined ? { description: option.hint } : {}),
          ...(option.disabled !== undefined ? { disabled: option.disabled } : {}),
        })),
        default: options.initialValue,
      });
    },
    password(options) {
      return password({
        message: options.message,
        mask: options.mask ?? '•',
        validate: adaptInquirerValidate(options.validate),
      });
    },
    isCancel(error: unknown) {
      return error instanceof Error && error.name === 'ExitPromptError';
    },
  };
}

function defaultOnCancel(locale: string | undefined): never {
  void locale;
  exit(0);
}

function defaultOnMissingNonInteractive(message: string): never {
  throw new Error(message);
}

function createTerminalHooks(
  locale: string | undefined,
  overrides?: Partial<RunPromptCatalogHooks>,
): RunPromptCatalogHooks {
  return createPromptCatalogHooks(locale, overrides, {
    onCancel: () => defaultOnCancel(locale),
    onMissingNonInteractive: defaultOnMissingNonInteractive,
  });
}

async function callPrompt<T>(
  run: () => Promise<T>,
  renderer: PromptTerminalRenderer,
  hooks: RunPromptCatalogHooks,
): Promise<T> {
  try {
    return await run();
  } catch (error: unknown) {
    if (renderer.isCancel(error)) {
      hooks.onCancel();
    }
    throw error;
  }
}

export async function runPromptCatalog(
  catalog: PromptsCatalog,
  options: RunPromptCatalogOptions = {},
): Promise<Record<string, PromptValue>> {
  const locale = resolvePromptCatalogLocale(options.locale);
  const t = createCliTranslate(locale);
  const promptIv = options.initialValues ?? {};
  const yesIv = options.yesInitialValues ?? {};
  const resolveIv: PromptInitialValues = options.yes ? { ...promptIv, ...yesIv } : promptIv;
  const useYesInitial = Boolean(options.yes);
  const hooks = createTerminalHooks(locale, options.hooks);
  const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !options.yes);
  const preset = options.values ?? {};
  const computationSeed = buildPromptComputationSeed(catalog, resolveIv);
  const out: Record<string, PromptValue> = {};
  const renderer = createInquirerRenderer();

  for (const [key, def] of Object.entries(catalog)) {
    const valuesSoFar = { ...computationSeed, ...out } as PromptCatalogValues;
    if (isPromptBlockSkipped(def, valuesSoFar)) {
      continue;
    }

    if (tryApplyPreset(key, def, preset, out, hooks, locale)) {
      const errV = await runPromptFieldValidate(
        def,
        out[key] as PromptValue,
        { ...computationSeed, ...out } as PromptCatalogValues,
      );
      if (errV) {
        hooks.onMissingNonInteractive(errV);
      }
      continue;
    }

    if (def.type === 'intro') {
      renderer.intro(resolvePromptText(def.title, locale));
      continue;
    }

    if (def.type === 'outro') {
      renderer.outro(resolvePromptText(def.message, locale));
      continue;
    }

    if (def.type === 'run') {
      await def.run({ ...computationSeed, ...out }, options.command);
      continue;
    }

    if (def.type === 'text') {
      const message = resolvePromptText(def.message, locale, key);
      const placeholder = def.placeholder !== undefined
        ? resolvePromptText(def.placeholder, locale)
        : undefined;
      if (!interactive) {
        const merged = mergedText(key, def, resolveIv, useYesInitial, valuesSoFar);
        if (def.required && isBlankText(merged)) {
          hooks.onMissingNonInteractive(t('promptCatalog.nonInteractive.textRequired', { key }));
        }
        out[key] = merged;
        const errT = await runPromptFieldValidate(
          def,
          merged,
          { ...computationSeed, ...out, [key]: merged } as PromptCatalogValues,
        );
        if (errT) {
          hooks.onMissingNonInteractive(errT);
        }
        continue;
      }

      const merged = mergedText(key, def, promptIv, false, valuesSoFar);
      const raw = await callPrompt(
        () => renderer.text({
          message,
          initialValue: merged,
          ...(placeholder !== undefined ? { placeholder } : {}),
          validate: (value) => {
            if (def.required && isBlankText(value)) {
              return t('promptCatalog.common.required');
            }

            if (!def.validate) {
              return undefined;
            }

            const currentValue = typeof value === 'string' ? value : String(value ?? '');
            const result = runPromptFieldValidate(
              def,
              currentValue,
              { ...computationSeed, ...out, [key]: currentValue } as PromptCatalogValues,
            );

            return result;
          },
        }),
        renderer,
        hooks,
      );
      out[key] = typeof raw === 'string' ? raw : merged;
      continue;
    }

    if (def.type === 'boolean') {
      const message = resolvePromptText(def.message, locale, key);
      if (!interactive) {
        const b = mergedBoolean(key, def, resolveIv, useYesInitial);
        out[key] = b;
        const errB = await runPromptFieldValidate(
          def,
          b,
          { ...computationSeed, ...out, [key]: b } as PromptCatalogValues,
        );
        if (errB) {
          hooks.onMissingNonInteractive(errB);
        }
        continue;
      }

      const merged = mergedBoolean(key, def, promptIv, false);
      if (def.validate) {
        for (;;) {
          const raw = await callPrompt(
            () => renderer.confirm({ message, initialValue: merged }),
            renderer,
            hooks,
          );
          const b = Boolean(raw);
          const errB = await runPromptFieldValidate(
            def,
            b,
            { ...computationSeed, ...out, [key]: b } as PromptCatalogValues,
          );
          if (errB) {
            renderer.error(errB);
            continue;
          }
          out[key] = b;
          break;
        }
        continue;
      }

      const raw = await callPrompt(
        () => renderer.confirm({ message, initialValue: merged }),
        renderer,
        hooks,
      );
      out[key] = Boolean(raw);
      continue;
    }

    if (def.type === 'select') {
      const message = resolvePromptText(def.message, locale, key);
      const valueList = selectOptionValues(def.options);
      if (def.required && def.options.length === 0) {
        hooks.onMissingNonInteractive(t('promptCatalog.nonInteractive.selectRequiredNoOptions', { key }));
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
              ? t('promptCatalog.nonInteractive.selectInvalidValue', { key, value: bad, options: valueList.join(', ') })
              : t('promptCatalog.nonInteractive.selectMissingDefault', { key }),
          );
        }
        out[key] = merged as string;
        const errS = await runPromptFieldValidate(
          def,
          merged as string,
          { ...computationSeed, ...out, [key]: merged } as PromptCatalogValues,
        );
        if (errS) {
          hooks.onMissingNonInteractive(errS);
        }
        continue;
      }

      const merged = mergedSelect(key, def, promptIv, false);
      const uiInitial =
        merged ??
        (def.initialValue && valueList.includes(def.initialValue) ? def.initialValue : undefined) ??
        valueList[0];
      if (uiInitial === undefined || !valueList.includes(uiInitial)) {
        const hint = def.required
          ? t('promptCatalog.nonInteractive.selectRequiredInteractive', { key })
          : t('promptCatalog.nonInteractive.selectMissingInteractiveDefault', { key });
        hooks.onMissingNonInteractive(hint);
      }

      if (def.validate) {
        for (;;) {
          const raw = await callPrompt(
            () => renderer.select<string>({
              message,
              options: inquirerSelectOptions(def.options, locale),
              initialValue: uiInitial,
            }),
            renderer,
            hooks,
          );
          const picked = raw as string;
          const errS = await runPromptFieldValidate(
            def,
            picked,
            { ...computationSeed, ...out, [key]: picked } as PromptCatalogValues,
          );
          if (errS) {
            renderer.error(errS);
            continue;
          }
          out[key] = picked;
          break;
        }
        continue;
      }

      const raw = await callPrompt(
        () => renderer.select<string>({
          message,
          options: inquirerSelectOptions(def.options, locale),
          initialValue: uiInitial,
        }),
        renderer,
        hooks,
      );
      out[key] = raw as string;
      continue;
    }

    if (def.type === 'password') {
      const message = resolvePromptText(def.message, locale, key);
      if (!interactive) {
        const merged = mergedPassword(key, def, resolveIv, useYesInitial, valuesSoFar);
        if (merged === undefined) {
          if (def.required) {
            hooks.onMissingNonInteractive(t('promptCatalog.nonInteractive.passwordRequired', { key }));
          }
          out[key] = '';
          const errPE = await runPromptFieldValidate(
            def,
            '',
            { ...computationSeed, ...out, [key]: '' } as PromptCatalogValues,
          );
          if (errPE) {
            hooks.onMissingNonInteractive(errPE);
          }
          continue;
        }
        if (def.required && isBlankText(merged)) {
          hooks.onMissingNonInteractive(t('promptCatalog.nonInteractive.passwordRequiredNonEmpty', { key }));
        }
        out[key] = merged;
        const errP = await runPromptFieldValidate(
          def,
          merged,
          { ...computationSeed, ...out, [key]: merged } as PromptCatalogValues,
        );
        if (errP) {
          hooks.onMissingNonInteractive(errP);
        }
        continue;
      }

      const raw = await callPrompt(
        () => renderer.password({
          message,
          mask: def.mask,
          validate: (value) => {
            if (def.required && isBlankText(value)) {
              return t('promptCatalog.common.required');
            }

            if (!def.validate) {
              return undefined;
            }

            const currentValue = typeof value === 'string' ? value : String(value ?? '');
            const result = runPromptFieldValidate(
              def,
              currentValue,
              { ...computationSeed, ...out, [key]: currentValue } as PromptCatalogValues,
            );

            return result;
          },
        }),
        renderer,
        hooks,
      );
      out[key] = typeof raw === 'string' ? raw : '';
      continue;
    }

    if (def.type === 'integer') {
      const message = resolvePromptText(def.message, locale, key);
      const placeholder = def.placeholder !== undefined
        ? resolvePromptText(def.placeholder, locale)
        : undefined;
      if (!interactive) {
        const merged = mergedInteger(key, def, resolveIv, useYesInitial);
        if (merged === undefined) {
          if (def.required) {
            hooks.onMissingNonInteractive(t('promptCatalog.nonInteractive.integerRequired', { key }));
          }
          const z = def.initialValue ?? 0;
          out[key] = z;
          const errI = await runPromptFieldValidate(
            def,
            z,
            { ...computationSeed, ...out, [key]: z } as PromptCatalogValues,
          );
          if (errI) {
            hooks.onMissingNonInteractive(errI);
          }
          continue;
        }
        out[key] = merged;
        const errI2 = await runPromptFieldValidate(
          def,
          merged,
          { ...computationSeed, ...out, [key]: merged } as PromptCatalogValues,
        );
        if (errI2) {
          hooks.onMissingNonInteractive(errI2);
        }
        continue;
      }

      const merged = mergedInteger(key, def, promptIv, false);
      const lineDefault = merged !== undefined ? String(merged) : String(def.initialValue ?? 0);
      const raw = await callPrompt(
        () => renderer.text({
          message,
          initialValue: lineDefault,
          ...(placeholder !== undefined ? { placeholder } : {}),
          validate: async (value) => {
            const trimmed = value.trim();
            if (trimmed === '') {
              if (def.required) {
                return t('promptCatalog.common.required');
              }

              if (def.validate) {
                const z = def.initialValue ?? 0;
                return runPromptFieldValidate(
                  def,
                  z,
                  { ...computationSeed, ...out, [key]: z } as PromptCatalogValues,
                );
              }

              return undefined;
            }
            if (!/^-?\\d+$/.test(trimmed)) {
              return t('promptCatalog.common.mustBeInteger');
            }

            if (!def.validate) {
              return undefined;
            }

            const n = Number.parseInt(trimmed, 10);
            return runPromptFieldValidate(
              def,
              n,
              { ...computationSeed, ...out, [key]: n } as PromptCatalogValues,
            );
          },
        }),
        renderer,
        hooks,
      );
      if (typeof raw === 'string' && raw.trim() === '' && !def.required) {
        out[key] = def.initialValue ?? 0;
        continue;
      }
      out[key] = Number.parseInt(String(raw).trim(), 10);
    }
  }

  return out;
}
