/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import {
  createCliTranslate,
  resolveCliLocale,
  resolveLocalizedText,
  type CliLocale,
  type LocalizedText,
} from './cli-locale.ts';
import {
  isPromptBlockSkipped,
  type PromptBlock,
  type PromptCatalogValues,
  type PromptInitialValues,
  type PromptsCatalog,
  type PromptValue,
  runPromptFieldValidate,
  type TextPromptBlock,
  selectOptionValues,
} from './prompt-catalog.ts';

const DEFAULT_SUBMIT = '/__pwc_ui_submit';
const DEFAULT_REFLOW = '/__pwc_ui_reflow';
const DEFAULT_VALIDATE_STEP = '/__pwc_ui_validate_step';
const DEFAULT_VALIDATE_FIELD = '/__pwc_ui_validate_field';
/** Form POST JSON meta field: current wizard step index when validating "Next" (not a prompt key). */
export const PWC_FORM_META_STEP = '_pwcStep';
/** Form POST JSON meta field: current field key when validating a single field. */
export const PWC_FORM_META_FIELD = '_pwcField';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_HOST = '127.0.0.1';

function resolveUiText(
  text: LocalizedText | undefined,
  locale: CliLocale,
  fallback = '',
): string {
  return resolveLocalizedText(text, { locale, fallback });
}

function hasValueKey(iv: PromptInitialValues, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(iv, key) && iv[key] !== undefined && iv[key] !== null
  );
}

function resolveTextDefault(def: TextPromptBlock, out: PromptCatalogValues): string {
  const iv = def.initialValue;
  if (typeof iv === 'function') {
    return String(iv(out) ?? '');
  }
  return String(iv ?? '');
}

function isInputBlock(def: PromptBlock): boolean {
  return (
    def.type === 'text' ||
    def.type === 'boolean' ||
    def.type === 'select' ||
    def.type === 'password' ||
    def.type === 'integer'
  );
}

/**
 * Merges CLI/env **`userPreset`** with catalog block defaults, in the same key order and with the
 * same `hidden` / `run` semantics as {@link isPromptBlockSkipped}, so the web form can prefill
 * and reflow `hidden` fields (e.g. `integer` when `select` changes).
 */
export function buildWebFormValuesFromCatalog(
  catalog: PromptsCatalog,
  userPreset: PromptInitialValues = {},
): PromptInitialValues {
  const out: Record<string, PromptValue> = {};
  for (const [key, def] of Object.entries(catalog)) {
    if (def.type === 'intro' || def.type === 'outro') {
      continue;
    }
    if (def.type === 'run') {
      continue;
    }
    if (!isInputBlock(def)) {
      continue;
    }
    if (isPromptBlockSkipped(def, out as PromptCatalogValues)) {
      continue;
    }
    if (hasValueKey(userPreset, key)) {
      out[key] = userPreset[key] as PromptValue;
    } else {
      out[key] = defaultValueForInput(key, def, out as PromptCatalogValues);
    }
  }
  return out;
}

function defaultValueForInput(
  key: string,
  def: PromptBlock,
  out: PromptCatalogValues,
): PromptValue {
  switch (def.type) {
    case 'text':
      return resolveTextDefault(def, out);
    case 'boolean':
      return def.initialValue !== undefined ? Boolean(def.initialValue) : true;
    case 'select': {
      const first = def.options
        .find((o) => typeof o === 'string' || o.disabled !== true);
      const firstValue = typeof first === 'string' ? first : first?.value;
      const i = def.initialValue;
      const enabledValues = def.options
        .filter((o) => typeof o === 'string' || o.disabled !== true)
        .map((o) => (typeof o === 'string' ? o : o.value));
      if (i !== undefined && enabledValues.includes(i)) {
        return i;
      }
      return firstValue ?? '';
    }
    case 'password':
      return def.initialValue ?? '';
    case 'integer':
      return def.initialValue !== undefined && Number.isFinite(def.initialValue) ? def.initialValue : 0;
    default:
      return '';
  }
}

type ReflowState = { show: Record<string, boolean>; values: Record<string, PromptValue> };

/**
 * Recomputes per-field visibility and the cumulative `out` used to evaluate `hidden` / `run`,
 * from current raw form data (e.g. after changing `select`). Matches how {@link isPromptBlockSkipped} uses `out` while iterating the catalog.
 */
export function reflowWebFormState(
  catalog: PromptsCatalog,
  raw: Record<string, unknown>,
  userSeed: PromptInitialValues = {},
): ReflowState {
  const out: Record<string, PromptValue> = {};
  const show: Record<string, boolean> = {};
  for (const [key, def] of Object.entries(catalog)) {
    if (def.type === 'intro' || def.type === 'outro') {
      continue;
    }
    if (def.type === 'run') {
      continue;
    }
    if (!isInputBlock(def)) {
      continue;
    }
    if (isPromptBlockSkipped(def, out as PromptCatalogValues)) {
      show[key] = false;
      continue;
    }
    show[key] = true;
    let val: PromptValue;
    if (rawBodyHasValueForKey(raw, key)) {
      val = normalizeWebRawForBlock(def, raw[key], key);
    } else if (hasValueKey(userSeed, key)) {
      val = userSeed[key] as PromptValue;
    } else {
      val = defaultValueForInput(key, def, out);
    }
    out[key] = val;
  }
  return { show, values: out };
}

/** `false` and `0` are valid; only `null` / `undefined` (or missing key) are treated as absent. */
function rawBodyHasValueForKey(raw: Record<string, unknown>, key: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(raw, key)) {
    return false;
  }
  const v = raw[key];
  return v !== undefined && v !== null;
}

function normalizeWebRawForBlock(def: PromptBlock, raw: unknown, key: string): PromptValue {
  switch (def.type) {
    case 'text':
      return String(raw ?? '');
    case 'boolean': {
      if (raw === false || raw === 'false' || raw === 0) {
        return false;
      }
      return raw === true || raw === 'true' || raw === 1 || raw === '1';
    }
    case 'select': {
      const s = String(raw ?? '');
      const list = def.options
        .filter((o) => typeof o === 'string' || o.disabled !== true)
        .map((o) => (typeof o === 'string' ? o : o.value));
      if (list.includes(s)) {
        return s;
      }
      return list[0] ?? s;
    }
    case 'password':
      return String(raw ?? '');
    case 'integer': {
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return Math.trunc(raw);
      }
      const t = String(raw ?? '').trim();
      if (t === '' || !/^-?\d+$/.test(t)) {
        return def.initialValue !== undefined && Number.isFinite(def.initialValue) ? def.initialValue : 0;
      }
      return Number.parseInt(t, 10);
    }
    default:
      return String(raw);
  }
}

export type BuildWebPresetFromBodyOptions = {
  /**
   * If set, only `required` and `validate(…)` for these keys are enforced; the rest of the
   * catalog is still merged into `preset` for context (e.g. wizard "Next" before the last step).
   * Omit for full submit.
   */
  scopeKeys?: Set<string> | null;
  locale?: string;
};

/**
 * Final preset `values` for {@link import('./prompt-catalog.ts').runPromptCatalog} from HTTP JSON body
 * (same keys and semantics as a filled web form: hidden fields omitted from the result when skipped).
 * Runs per-field **`validate`** (including async) from the catalog (honoring {@link BuildWebPresetFromBodyOptions}).
 */
export async function buildWebPresetFromBody(
  catalog: PromptsCatalog,
  raw: Record<string, unknown>,
  userSeed: PromptInitialValues = {},
  buildOpts: BuildWebPresetFromBodyOptions = {},
): Promise<{ preset: PromptInitialValues; error?: string; fieldKey?: string }> {
  const locale = resolveCliLocale(buildOpts.locale);
  const t = createCliTranslate(locale);
  const scope = buildOpts.scopeKeys ?? null;
  const inScope = (k: string) => scope === null || scope.has(k);
  const preset: Record<string, PromptValue> = {};
  for (const [key, def] of Object.entries(catalog)) {
    if (def.type === 'intro' || def.type === 'outro') {
      continue;
    }
    if (def.type === 'run') {
      continue;
    }
    if (!isInputBlock(def)) {
      continue;
    }
    if (isPromptBlockSkipped(def, preset as PromptCatalogValues)) {
      continue;
    }
    let val: PromptValue;
    if (rawBodyHasValueForKey(raw, key)) {
      val = normalizeWebRawForBlock(def, raw[key], key);
    } else if (hasValueKey(userSeed, key)) {
      val = userSeed[key] as PromptValue;
    } else {
      val = defaultValueForInput(key, def, preset);
    }
    if (def.type === 'text' && def.required && val === '' && inScope(key)) {
      return { preset: {}, error: t('promptCatalog.web.fieldRequired', { key }), fieldKey: key };
    }
    if (def.type === 'password' && def.required && val === '' && inScope(key)) {
      return { preset: {}, error: t('promptCatalog.web.fieldRequired', { key }), fieldKey: key };
    }
    if (def.type === 'integer' && def.required && inScope(key)) {
      const trimmed = String(raw[key] ?? '').trim();
      if (trimmed === '') {
        return { preset: {}, error: t('promptCatalog.web.fieldRequired', { key }), fieldKey: key };
      }
      if (!/^-?\d+$/.test(trimmed)) {
        return { preset: {}, error: t('promptCatalog.web.fieldMustBeInteger', { key }), fieldKey: key };
      }
    }
    preset[key] = val;
    if (inScope(key)) {
      const errCustom = await runPromptFieldValidate(
        def,
        val,
        preset as unknown as PromptCatalogValues,
      );
      if (errCustom) {
        return { preset: {}, error: errCustom, fieldKey: key };
      }
    }
  }
  return { preset };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type PwcWizardStepDef = { title: string; description?: string; keys: string[] };

function computePwcWizardSteps(
  options: RunPromptCatalogWebUIOptions,
  merged: PromptsCatalog,
  locale: CliLocale,
): PwcWizardStepDef[] {
  const t = createCliTranslate(locale);
  if (options.stages && options.stages.length > 0) {
    if (options.stages.length === 1) {
      const st0 = options.stages[0];
      const allKeys: string[] = [];
      for (const [key, def] of Object.entries(merged)) {
        if (isInputBlock(def)) {
          allKeys.push(key);
        }
      }
      const title = resolveUiText(st0.sectionTitle, locale).trim();
      const description = resolveUiText(st0.sectionDescription, locale).trim();
      return [
        {
          title: title && title.length > 0 ? title : t('promptCatalog.web.defaultFormTitle'),
          ...(description && description.length > 0 ? { description } : {}),
          keys: allKeys,
        },
      ];
    }
    return options.stages.map((st, i) => {
      const keys: string[] = [];
      for (const [key, def] of Object.entries(st.catalog)) {
        if (isInputBlock(def)) {
          keys.push(key);
        }
      }
      const title = resolveUiText(st.sectionTitle, locale).trim();
      const description = resolveUiText(st.sectionDescription, locale).trim();
      return {
        title: title && title.length > 0 ? title : t('promptCatalog.web.defaultStepTitle', { index: i + 1 }),
        ...(description && description.length > 0 ? { description } : {}),
        keys,
      };
    });
  }
  const allKeys: string[] = [];
  for (const [key, def] of Object.entries(merged)) {
    if (isInputBlock(def)) {
      allKeys.push(key);
    }
  }
  if (allKeys.length === 0) {
    return [];
  }
  /* Single `catalog` (no `stages`): one page, no side Steps nav — use `stages` for multi-page UI. */
  return [{ title: t('promptCatalog.web.defaultFormTitle'), keys: allKeys }];
}

/** antd Form.Item-style explain line (per-field error / help). */
const PWC_FORM_ITEM_EXPLAIN = '<div class="pwc-form-item-explain" data-pwc-explain="1" role="alert" hidden></div>';
/** Suffix slot for status icon (e.g. fail) — filled by client script. */
const PWC_FORM_ITEM_SUFFIX = '<span class="pwc-form-item-suffix" data-pwc-suffix="1" aria-hidden="true"></span>';

function renderPwcRadioOptions(
  key: string,
  def: Extract<PromptBlock, { type: 'select' }>,
  defaults: PromptInitialValues,
  hidden: boolean,
  locale: CliLocale,
): string {
  return def.options
    .map((o, index) => {
      const val = typeof o === 'string' ? o : o.value;
      const lab = typeof o === 'string' ? o : resolveUiText(o.label, locale, o.value);
      const hint = typeof o === 'string'
        ? ''
        : o.hint
          ? `<div class="pwc-radio-option-hint">${escapeHtml(resolveUiText(o.hint, locale))}</div>`
          : '';
      const optionDisabled = typeof o !== 'string' && o.disabled === true;
      const checked = String(defaults[key] ?? '') === val ? ' checked' : '';
      const required = def.required && index === 0 ? ' required' : '';
      const disabled = hidden || optionDisabled ? ' disabled' : '';
      const optionClass = optionDisabled ? 'pwc-radio-option pwc-radio-option--disabled' : 'pwc-radio-option';
      const ariaDisabled = optionDisabled ? ' aria-disabled="true"' : '';
      const staticDisabled = optionDisabled ? ' data-pwc-static-disabled="1"' : '';
      return (
        `<label class="${optionClass}"${ariaDisabled}>` +
        `<input class="pwc-radio-input" name="${escapeHtml(key)}" type="radio" value="${escapeHtml(String(val))}"${checked}${required}${disabled}${staticDisabled} />` +
        `<span class="pwc-radio-option-body">` +
        `<span class="pwc-radio-option-label">${escapeHtml(String(lab))}</span>` +
        hint +
        `</span>` +
        `</label>`
      );
    })
    .join('');
}

function renderPwcFieldRow(
  key: string,
  def: PromptBlock,
  defaults: PromptInitialValues,
  show: Record<string, boolean>,
  locale: CliLocale,
): string {
  if (!isInputBlock(def)) {
    return '';
  }
  const labelText = 'message' in def ? resolveUiText(def.message, locale, key) : key;
  const hidden = show[key] === false;
  const display = hidden ? 'none' : 'block';
  const itemOpen = (extraClass: string) =>
    `<div class="pwc-form-item${extraClass ? ` ${extraClass}` : ''}" data-pwc-wrap="${escapeHtml(
      key,
    )}" data-pwc-field="${escapeHtml(key)}" style="display:${display}">`;
  if (def.type === 'text') {
    const req = def.required ? ' required' : '';
    const disabled = hidden ? ' disabled' : '';
    const ph = def.placeholder ? ` placeholder="${escapeHtml(resolveUiText(def.placeholder, locale))}"` : '';
    const v = escapeHtml(String(defaults[key] ?? ''));
    return (
      itemOpen('') +
      `<div class="pwc-form-item-label"><span class="pwc-l">${escapeHtml(labelText)}</span></div>` +
      `<div class="pwc-form-item-control">` +
      `<div class="pwc-form-item-control-input">` +
      `<div class="pwc-input-affix-wrapper">` +
      `<input class="pwc-form-input" name="${escapeHtml(key)}" type="text" value="${v}"${ph}${req}${disabled} autocomplete="off" />` +
      PWC_FORM_ITEM_SUFFIX +
      `</div></div>` +
      PWC_FORM_ITEM_EXPLAIN +
      `</div></div>`
    );
  }
  if (def.type === 'boolean') {
    const checked = defaults[key] === true ? ' checked' : '';
    const disabled = hidden ? ' disabled' : '';
    return (
      itemOpen('pwc-form-item--bool') +
      `<div class="pwc-bool-wrap"><label><input class="pwc-bool-input" name="${escapeHtml(
        key,
      )}" type="checkbox" value="1"${checked}${disabled} /> <span class="pwc-l">${escapeHtml(labelText)}</span></label></div>` +
      PWC_FORM_ITEM_EXPLAIN +
      `</div>`
    );
  }
  if (def.type === 'select') {
    if (def.variant === 'radio') {
      const opts = renderPwcRadioOptions(key, def, defaults, hidden, locale);
      return (
        itemOpen('') +
        `<div class="pwc-form-item-label"><span class="pwc-l">${escapeHtml(labelText)}</span></div>` +
        `<div class="pwc-form-item-control">` +
        `<div class="pwc-form-item-control-input">` +
        `<div class="pwc-radio-group" role="radiogroup" aria-label="${escapeHtml(labelText)}">` +
        opts +
        `</div></div>` +
        PWC_FORM_ITEM_EXPLAIN +
        `</div></div>`
      );
    }
    const opts = def.options
      .map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : resolveUiText(o.label, locale, o.value);
        const sel = String(defaults[key] ?? '') === val ? ' selected' : '';
        const disabledOpt = typeof o !== 'string' && o.disabled === true ? ' disabled' : '';
        return `<option value="${escapeHtml(String(val))}"${sel}${disabledOpt}>${escapeHtml(String(lab))}</option>`;
      })
      .join('');
    const req = def.required ? ' required' : '';
    const disabled = hidden ? ' disabled' : '';
    return (
      itemOpen('') +
      `<div class="pwc-form-item-label"><span class="pwc-l">${escapeHtml(labelText)}</span></div>` +
      `<div class="pwc-form-item-control">` +
      `<div class="pwc-form-item-control-input">` +
      `<div class="pwc-input-affix-wrapper pwc-input-affix-wrapper--select">` +
      `<select class="pwc-form-input" name="${escapeHtml(key)}"${req}${disabled}>${opts}</select>` +
      PWC_FORM_ITEM_SUFFIX +
      `</div></div>` +
      PWC_FORM_ITEM_EXPLAIN +
      `</div></div>`
    );
  }
  if (def.type === 'password') {
    const req = def.required ? ' required' : '';
    const disabled = hidden ? ' disabled' : '';
    const v = escapeHtml(String(defaults[key] ?? ''));
    return (
      itemOpen('') +
      `<div class="pwc-form-item-label"><span class="pwc-l">${escapeHtml(labelText)}</span></div>` +
      `<div class="pwc-form-item-control">` +
      `<div class="pwc-form-item-control-input">` +
      `<div class="pwc-input-affix-wrapper">` +
      `<input class="pwc-form-input" name="${escapeHtml(key)}" type="password" value="${v}"${req}${disabled} autocomplete="new-password" />` +
      PWC_FORM_ITEM_SUFFIX +
      `</div></div>` +
      PWC_FORM_ITEM_EXPLAIN +
      `</div></div>`
    );
  }
  if (def.type === 'integer') {
    const ph = def.placeholder ? ` placeholder="${escapeHtml(resolveUiText(def.placeholder, locale))}"` : '';
    const req = def.required ? ' required' : '';
    const disabled = hidden ? ' disabled' : '';
    const v = String(defaults[key] ?? 0);
    return (
      itemOpen('') +
      `<div class="pwc-form-item-label"><span class="pwc-l">${escapeHtml(labelText)}</span></div>` +
      `<div class="pwc-form-item-control">` +
      `<div class="pwc-form-item-control-input">` +
      `<div class="pwc-input-affix-wrapper">` +
      `<input class="pwc-form-input" name="${escapeHtml(
        key,
      )}" type="number" inputmode="numeric" step="1" value="${escapeHtml(v)}"${ph}${req}${disabled} />` +
      PWC_FORM_ITEM_SUFFIX +
      `</div></div>` +
      PWC_FORM_ITEM_EXPLAIN +
      `</div></div>`
    );
  }
  return '';
}

/* Ant Design Steps icon: ~14px inside 32px container (iconFontSize token) */
const PWC_AD_CHECK_SVG = `<svg class="pwc-ad-icon-check-svg" viewBox="0 0 12 12" width="14" height="14" focusable="false" aria-hidden="true"><path fill="currentColor" d="M10.28 1.5L4.4 7.4 1.7 4.7 0.5 5.9l3.2 3.2 1.1 1.1L11.4 2.6z"/></svg>`;
/** antd Alert `type="error"`-style leading icon (14px) — @see https://ant.design/components/alert */
const PWC_AD_ALERT_ERROR_ICON_SVG = `<svg class="pwc-ad-alert__svg" viewBox="0 0 14 14" width="14" height="14" focusable="false" aria-hidden="true"><path fill="currentColor" d="M7 0.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13zm0 1.2a5.3 5.3 0 1 1 0 10.6A5.3 5.3 0 0 1 7 1.7zM6.4 3.4h1.2v3.6H6.4V3.4zm0 4.5h1.2v1.1H6.4V7.9z"/></svg>`;
/** antd Alert `type="success"`-style leading icon (14px) — @see https://ant.design/components/alert */
const PWC_AD_ALERT_SUCCESS_ICON_SVG = `<svg class="pwc-ad-alert__svg" viewBox="0 0 14 14" width="14" height="14" focusable="false" aria-hidden="true"><path fill="currentColor" d="M7 0.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13zm-1 8.45L3.65 6.1l-.85.85L6 10.15l5.2-5.2-.85-.85L6.5 7.95z"/></svg>`;
/** Suffix “fail” icon (antd Form validation) — @see https://ant.design/components/form */
const PWC_FORM_FAIL_ICON_SVG = `<svg class="pwc-form-fail__svg" viewBox="0 0 14 14" width="14" height="14" focusable="false" aria-hidden="true"><circle cx="7" cy="7" r="6.5" fill="currentColor"/><path fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" d="M4.2 4.2l5.6 5.6M9.8 4.2l-5.6 5.6"/></svg>`;

/**
 * **Vertical** {@link https://ant.design/components/steps-cn | Steps} (`orientation="vertical"`),
 * with CSS aligned to antd tokens (icon 32px, 14px title, `colorSplit` rail, `wait` / `process` / `finish`).
 * Primary in steps uses antd default blue in light / `#1668dc` in dark; form primary buttons still use the page accent.
 */
function buildPwcAntdStyleStepsHeader(
  stepDefs: PwcWizardStepDef[],
  currentIndex: number,
  total: number,
  visibleStepIndices: number[],
  uiText: {
    stepsAriaLabel: string;
    doneAriaLabel: string;
  },
): string {
  const parts: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const st = i < stepDefs.length ? stepDefs[i] : { title: `Step ${i + 1}`, keys: [] as string[] };
    const t = st.title;
    const rawDesc = st.description?.trim() ?? '';
    const descHtml =
      rawDesc.length > 0
        ? `<div class="pwc-ad-steps-item-description">${escapeHtml(rawDesc)}</div>`
        : '';
    const visiblePos = visibleStepIndices.indexOf(i);
    const currentVisiblePos = visibleStepIndices.indexOf(currentIndex);
    const state = visiblePos < currentVisiblePos ? 'finish' : i === currentIndex ? 'process' : 'wait';
    const num = visiblePos + 1;
    const hiddenAttr = visiblePos === -1 ? ' hidden' : '';
    const iconHtml =
      state === 'finish'
        ? `<span class="pwc-ad-icon pwc-ad-icon--finish" aria-label="${escapeHtml(uiText.doneAriaLabel)}">${PWC_AD_CHECK_SVG}</span>`
        : `<span class="pwc-ad-icon" aria-label="${num}"><span class="pwc-ad-icon-num">${num}</span></span>`;
    const ariaCurrent = state === 'process' ? 'step' : 'false';
    const nextVisible = visibleStepIndices.indexOf(i + 1) !== -1;
    const tailDone = visiblePos !== -1 && currentVisiblePos !== -1 && visiblePos < currentVisiblePos;
    const tailHtml =
      i < total - 1
        ? `<div class="pwc-ad-vert__tail" data-pwc-vtail="${i}" data-pwc-conn="${tailDone ? 'done' : 'todo'}" aria-hidden="true"${nextVisible && visiblePos !== -1 ? '' : ' hidden'}></div>`
        : '';
    parts.push(
      `<li class="pwc-ad-steps-item pwc-ad-steps-item--${state}" data-pwc-step-idx="${i}" data-pwc-state="${state}" role="listitem" aria-current="${ariaCurrent}"${hiddenAttr}>` +
        `<div class="pwc-ad-steps-item-row">` +
        `<div class="pwc-ad-vert">` +
        `<div class="pwc-ad-vert__icon" aria-hidden="true">${iconHtml}</div>` +
        tailHtml +
        `</div>` +
        `<div class="pwc-ad-vert__main">` +
        `<div class="pwc-ad-steps-item-title" title="${escapeHtml(t)}">${escapeHtml(t)}</div>` +
        descHtml +
        `</div>` +
        `</div></li>`,
    );
  }
  return (
    `<nav class="pwc-ad-steps pwc-ad-steps--vertical" id="pwcAntSteps" aria-label="${escapeHtml(uiText.stepsAriaLabel)}" style="--pwc-ad-n:${total}">` +
    `<ol class="pwc-ad-steps-list pwc-ad-steps-list--vertical">${parts.join('')}</ol></nav>`
  );
}

function computeInitialVisibleStepIndices(
  catalog: PromptsCatalog,
  stepDefs: PwcWizardStepDef[],
  show: Record<string, boolean>,
): number[] {
  const visible: number[] = [];
  for (let i = 0; i < stepDefs.length; i += 1) {
    if (i === 0) {
      visible.push(i);
      continue;
    }
    const hasVisibleField = stepDefs[i].keys.some((key) => {
      const def = catalog[key];
      return Boolean(def && isInputBlock(def) && show[key] !== false);
    });
    if (hasVisibleField) {
      visible.push(i);
    }
  }
  return visible.length > 0 ? visible : [0];
}

function buildPwcFormHtml(
  catalog: PromptsCatalog,
  defaults: PromptInitialValues,
  show: Record<string, boolean>,
  stepDefs: PwcWizardStepDef[],
  initialStepIndex: number,
  totalSteps: number,
  locale: CliLocale,
  uiText: {
    stepsSidebarAriaLabel: string;
    stepNavigationAriaLabel: string;
    submitAriaLabel: string;
    back: string;
    next: string;
    submit: string;
    stepsAriaLabel: string;
    doneAriaLabel: string;
  },
): string {
  if (stepDefs.length === 0) {
    return '';
  }
  const oneStep = stepDefs.length === 1;
  const visibleStepIndices = computeInitialVisibleStepIndices(catalog, stepDefs, show);
  const out: string[] = [];
  if (!oneStep) {
    out.push('<div class="pwc-wizard pwc-wizard--with-sidebar" id="pwcWizard">');
    out.push(
      `<aside class="pwc-wizard-sidenav" id="pwcWizardSidenav" aria-label="${escapeHtml(uiText.stepsSidebarAriaLabel)}">`,
    );
    out.push(buildPwcAntdStyleStepsHeader(stepDefs, initialStepIndex, totalSteps, visibleStepIndices, uiText));
    out.push('</aside><div class="pwc-wizard-main">');
  } else {
    out.push('<div class="pwc-wizard" id="pwcWizard">');
  }
  for (let i = 0; i < stepDefs.length; i += 1) {
    const sd = stepDefs[i];
    const active = i === initialStepIndex;
    const hiddenAttr = active ? '' : ' hidden';
    out.push(
      `<section class="pwc-step${active ? ' pwc-step--active' : ''}" data-pwc-step="${i}"${hiddenAttr} aria-label="${escapeHtml(sd.title)}">`,
    );
    if (!oneStep) {
      out.push(`<h2 class="pwc-step-title">${escapeHtml(sd.title)}</h2>`);
    }
    for (const key of sd.keys) {
      const def = catalog[key];
      if (def) {
        out.push(renderPwcFieldRow(key, def, defaults, show, locale));
      }
    }
    out.push('</section>');
  }
  if (!oneStep) {
    out.push(
      `<div class="pwc-wizard-ctl" id="pwcWizardCtl" role="group" aria-label="${escapeHtml(uiText.stepNavigationAriaLabel)}">` +
        `<button type="button" class="pwc-btn-pager" id="pwcBack" ${initialStepIndex === 0 ? 'hidden' : ''}>${escapeHtml(uiText.back)}</button>` +
        `<div class="pwc-wizard-ctl-spacer" aria-hidden="true"></div>` +
        `<button type="button" class="pwc-btn-pager pwc-btn-pager--primary" id="pwcNext" ${initialStepIndex >= totalSteps - 1 ? 'hidden' : ''}>${escapeHtml(uiText.next)}</button>` +
        `<button type="submit" class="pwc-btn-submit pwc-wizard-ctl__submit" id="pwcFormSubmit" ${initialStepIndex < totalSteps - 1 ? 'hidden' : ''}>${escapeHtml(uiText.submit)}</button>` +
        `</div>`,
    );
  } else {
    out.push(
      `<div class="pwc-wizard-ctl" id="pwcWizardCtl" role="group" aria-label="${escapeHtml(uiText.submitAriaLabel)}">` +
        `<div class="pwc-wizard-ctl-spacer" aria-hidden="true"></div>` +
        `<button type="submit" class="pwc-btn-submit pwc-wizard-ctl__submit" id="pwcFormSubmit">${escapeHtml(uiText.submit)}</button>` +
        `</div>`,
    );
  }
  /* Status / error Alert: under main form column only, not full-width under the side Steps. */
  out.push(
    '<div id="pwcStatus" class="pwc-ad-status pwc-ad-status--empty" role="status" aria-live="polite"></div>',
  );
  if (!oneStep) {
    out.push('</div></div>');
  } else {
    out.push('</div>');
  }
  return out.join('\n');
}

function readFormFromClient(body: unknown): Record<string, unknown> {
  if (body === null || body === undefined || typeof body !== 'object') {
    return {};
  }
  return { ...(body as Record<string, unknown>) };
}

function readFormFromClientStrippingPwcMeta(o: Record<string, unknown>): Record<string, unknown> {
  if (!Object.prototype.hasOwnProperty.call(o, PWC_FORM_META_STEP)) {
    return { ...o };
  }
  const { [PWC_FORM_META_STEP]: _meta, ...rest } = o;
  return rest;
}

function openUrlInDefaultBrowser(url: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
  } else if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true, windowsHide: true }).unref();
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
  }
}

function closePromptWebUiServer(server: Server, done: () => void): void {
  server.close(done);
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
}

/** One group of `runPromptCatalog` fields; all keys must be **unique** across the whole `stages` array. */
export type RunPromptCatalogWebUIStage = {
  /**
   * Optional group heading, inserted before the first **input** field of this `catalog` (ignores
   * `intro` / `outro` / `run` in that catalog, like the form renderer does).
   */
  sectionTitle?: LocalizedText;
  /**
   * Optional sub-line under the step title in the **Steps** nav (like antd `subTitle` / description).
   */
  sectionDescription?: LocalizedText;
  /**
   * Preset merged in order: first global {@link RunPromptCatalogWebUIOptions.values}, then
   * `stages[0].values`, `stages[1].values`, … (later keys override).
   */
  values?: PromptInitialValues;
  catalog: PromptsCatalog;
};

export type RunPromptCatalogWebUIOptions = {
  /**
   * Single catalog. **Do not** set together with `stages` (use one or the other).
   */
  catalog?: PromptsCatalog;
  /**
   * Several catalogs in order (e.g. env → app → db). Keys must be **unique** across all stages.
   * Each `catalog` is merged in definition order; `hidden(…)` can depend on values from **any**
   * previous stage, because the merged `PromptsCatalog` is evaluated in one key order.
   */
  stages?: RunPromptCatalogWebUIStage[];
  /** Merged on top of catalog block defaults to prefill the form (CLI `values` / flags). */
  values?: PromptInitialValues;
  pageTitle?: LocalizedText;
  documentHeading?: LocalizedText;
  /** Optional hint shown under the document heading. */
  documentHint?: LocalizedText;
  /**
   * Path for POSTing the final form JSON. Default {@link DEFAULT_SUBMIT}.
   */
  submitPath?: string;
  reflowPath?: string;
  /**
   * POST path for “Next” in a multi-step form: same JSON as submit plus {@link PWC_FORM_META_STEP}.
   * Default {@link DEFAULT_VALIDATE_STEP} (only used when the UI has 2+ steps).
   */
  validateStepPath?: string;
  /**
   * POST path for single-field async validation: same JSON as submit plus {@link PWC_FORM_META_FIELD}.
   * Default {@link DEFAULT_VALIDATE_FIELD}.
   */
  validateFieldPath?: string;
  host?: string;
  port?: number;
  timeoutMs?: number;
  /**
   * Invoked once when the local HTTP server is listening (before the default browser is opened).
   * Use to log the bound URL, especially when {@link port} is `0` and the OS assigns a port.
   */
  onServerStart?: (args: { host: string; port: number; url: string }) => void;
  onOpenBrowserError?: (url: string, error: unknown) => void;
  locale?: string;
};

/**
 * Second argument to {@link runPromptCatalogWebUI} when the {@link PromptsCatalog} is passed as the
 * **first** argument. Omit `catalog` and `stages` here; the form is always a **single** page
 * (no side Steps). Pass `stages` in the options object to get multi-step navigation.
 */
export type RunPromptCatalogWebUIOptionsWithoutSource = Omit<
  RunPromptCatalogWebUIOptions,
  'catalog' | 'stages'
>;

/**
 * Merge multiple `stages` into one `PromptsCatalog` in order; duplicate keys throw.
 * `sectionBeforeKey` maps the **first input** key in each stage (if `sectionTitle` is set) to a heading.
 */
export function mergeWebUICatalogsFromStages(stages: RunPromptCatalogWebUIStage[]): {
  merged: PromptsCatalog;
  sectionBeforeKey: Map<string, string>;
} {
  if (!stages.length) {
    throw new Error('mergeWebUICatalogsFromStages: `stages` must be non-empty.');
  }
  const merged: PromptsCatalog = {};
  const sectionBeforeKey = new Map<string, string>();
  const used = new Set<string>();

  for (const stage of stages) {
    const title = typeof stage.sectionTitle === 'string' ? stage.sectionTitle.trim() : '';
    let needTitle = Boolean(title);
    for (const [key, def] of Object.entries(stage.catalog)) {
      if (isInputBlock(def) && needTitle && title) {
        sectionBeforeKey.set(key, title);
        needTitle = false;
      }
    }
    for (const [key, def] of Object.entries(stage.catalog)) {
      if (used.has(key)) {
        throw new Error(
          `runPromptCatalogWebUI: duplicate prompt key "${key}" across stages; use unique keys in each \`PromptsCatalog\`.`,
        );
      }
      used.add(key);
      merged[key] = def;
    }
  }
  return { merged, sectionBeforeKey };
}

function resolveMergedCatalog(
  options: RunPromptCatalogWebUIOptions,
): { merged: PromptsCatalog; sectionBeforeKey: Map<string, string> } {
  if (options.stages !== undefined && options.stages.length > 0) {
    if (options.catalog !== undefined) {
      throw new Error('runPromptCatalogWebUI: set only one of `catalog` or `stages`, not both.');
    }
    return mergeWebUICatalogsFromStages(options.stages);
  }
  if (options.catalog !== undefined) {
    return { merged: options.catalog, sectionBeforeKey: new Map() };
  }
  throw new Error('runPromptCatalogWebUI: set `options.catalog` or a non-empty `options.stages`.');
}

function mergeValueSeedsFromOptions(options: RunPromptCatalogWebUIOptions): PromptInitialValues {
  let s: PromptInitialValues = { ...(options.values ?? {}) };
  if (options.stages) {
    for (const st of options.stages) {
      if (st.values) {
        s = { ...s, ...st.values };
      }
    }
  }
  return s;
}

const PROMPT_BLOCK_TYPE_MARKERS = new Set<string>([
  'intro',
  'outro',
  'text',
  'boolean',
  'select',
  'password',
  'integer',
  'run',
]);

/**
 * `PromptsCatalog` is a record of block defs (each with a `type`). Used to disambiguate
 * `runPromptCatalogWebUI(maybeCatalog)` from `runPromptCatalogWebUI({ pageTitle, values, … })`.
 */
function looksLikeOnlyPromptsCatalog(o: object): boolean {
  const values = Object.values(o);
  if (values.length === 0) {
    return false;
  }
  for (const v of values) {
    if (typeof v !== 'object' || v === null || !('type' in v)) {
      return false;
    }
    const t = (v as { type: unknown }).type;
    if (typeof t !== 'string' || !PROMPT_BLOCK_TYPE_MARKERS.has(t)) {
      return false;
    }
  }
  return true;
}

/**
 * Serves a dynamic HTML form for one or more {@link PromptsCatalog} groups (`stages` or a single
 * `catalog`); `intro` / `outro` / `run` are not rendered, same as a single-cat run. Resolves with
 * one `values` preset for `runPromptCatalog` / multiple chained runs.
 *
 * - One argument: a full `RunPromptCatalogWebUIOptions` (with `catalog` or `stages`), or a
 *   {@link PromptsCatalog} if every value is a prompt block. Pass `{ catalog, … }` when ambiguous.
 * - Two arguments: `catalog` and optional options (same as `{ …options, catalog }`). Use
 *   {@link RunPromptCatalogWebUIOptionsWithoutSource} for the second object when you do not use
 *   `stages` (the catalog is only the first parameter).
 */
export function runPromptCatalogWebUI(
  catalog: PromptsCatalog,
  options?: RunPromptCatalogWebUIOptionsWithoutSource,
): Promise<PromptInitialValues>;
export function runPromptCatalogWebUI(
  options: RunPromptCatalogWebUIOptions,
): Promise<PromptInitialValues>;
export function runPromptCatalogWebUI(
  catalogOrOptions: PromptsCatalog | RunPromptCatalogWebUIOptions,
  options?: RunPromptCatalogWebUIOptions,
): Promise<PromptInitialValues> {
  if (options !== undefined) {
    return runPromptCatalogWebUIImpl({ ...options, catalog: catalogOrOptions as PromptsCatalog });
  }
  if (typeof catalogOrOptions === 'object' && catalogOrOptions !== null) {
    if ('stages' in catalogOrOptions || 'catalog' in catalogOrOptions) {
      return runPromptCatalogWebUIImpl(catalogOrOptions);
    }
    if (looksLikeOnlyPromptsCatalog(catalogOrOptions)) {
      return runPromptCatalogWebUIImpl({ catalog: catalogOrOptions as PromptsCatalog });
    }
    return runPromptCatalogWebUIImpl(catalogOrOptions);
  }
  return runPromptCatalogWebUIImpl({ catalog: catalogOrOptions as PromptsCatalog });
}

function runPromptCatalogWebUIImpl(options: RunPromptCatalogWebUIOptions): Promise<PromptInitialValues> {
  const locale = resolveCliLocale(options.locale);
  const t = createCliTranslate(locale);
  const { merged } = resolveMergedCatalog(options);
  const userSeed = mergeValueSeedsFromOptions(options);
  const formDefaults = buildWebFormValuesFromCatalog(merged, userSeed);
  const initialShow = reflowWebFormState(
    merged,
    Object.fromEntries(
      Object.entries(formDefaults).map(([k, v]) => [k, v] as [string, unknown]),
    ),
    userSeed,
  ).show;
  const submitPath = options.submitPath ?? DEFAULT_SUBMIT;
  const reflowPath = options.reflowPath ?? DEFAULT_REFLOW;
  const host = options.host ?? DEFAULT_HOST;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pageTitle = resolveUiText(options.pageTitle, locale, t('promptCatalog.web.pageTitle'));
  const h1 = resolveUiText(options.documentHeading, locale, t('promptCatalog.web.documentHeading'));
  const documentHint = resolveUiText(options.documentHint, locale, t('promptCatalog.web.documentHint'));

  const catalog = merged;
  const pwcStepDefs = computePwcWizardSteps(options, catalog, locale);
  const pwcNSteps = Math.max(1, pwcStepDefs.length);
  const resolveValidateStepPath = options.validateStepPath ?? DEFAULT_VALIDATE_STEP;
  const resolveValidateFieldPath = options.validateFieldPath ?? DEFAULT_VALIDATE_FIELD;
  const uiText = {
    stepsAriaLabel: t('promptCatalog.web.stepsAriaLabel'),
    stepsSidebarAriaLabel: t('promptCatalog.web.stepsSidebarAriaLabel'),
    stepNavigationAriaLabel: t('promptCatalog.web.stepNavigationAriaLabel'),
    submitAriaLabel: t('promptCatalog.web.submitAriaLabel'),
    back: t('promptCatalog.web.back'),
    next: t('promptCatalog.web.next'),
    submit: t('promptCatalog.web.submit'),
    checking: t('promptCatalog.web.checking'),
    sending: t('promptCatalog.web.sending'),
    successTitle: t('promptCatalog.web.successTitle'),
    errorTitle: t('promptCatalog.web.errorTitle'),
    savedAndClosing: t('promptCatalog.web.savedAndClosing'),
    savedCloseBlocked: t('promptCatalog.web.savedCloseBlocked'),
    invalidValue: t('promptCatalog.web.invalidValue'),
    invalidRequest: t('promptCatalog.web.invalidRequest'),
    invalidStep: t('promptCatalog.web.invalidStep'),
    invalidField: t('promptCatalog.web.invalidField'),
    doneAriaLabel: 'done',
  };
  let server: Server | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return new Promise((resolve, reject) => {
    const rejectAndClose = (err: Error) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (server) {
        closePromptWebUiServer(server, () => reject(err));
      } else {
        reject(err);
      }
    };

    const servePage = (port: number) => {
      const base = `http://${host}:${port}`;
      const formInner = buildPwcFormHtml(
        catalog,
        formDefaults,
        initialShow,
        pwcStepDefs,
        0,
        pwcNSteps,
        locale,
        uiText,
      );
      const wizardClientJson = JSON.stringify({ n: pwcNSteps, stepDefs: pwcStepDefs });
      const pwcValStepUrl =
        pwcNSteps > 1 ? JSON.stringify(base + resolveValidateStepPath) : 'null';
      const pwcValFieldUrl = JSON.stringify(base + resolveValidateFieldPath);
      const uiTextJson = JSON.stringify(uiText);
      const pwcShellClass =
        options.stages && options.stages.length > 0
          ? 'pwc-shell pwc-shell--stages'
          : 'pwc-shell';
      const page = `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    :root {
      --pwc-bg: #f5f5f5;
      --pwc-bg-grad: radial-gradient(1200px 560px at 100% 0%, rgba(22, 119, 255, 0.08) 0%, transparent 46%),
        radial-gradient(900px 420px at 0% 100%, rgba(114, 46, 209, 0.05) 0%, transparent 52%);
      --pwc-surface: #ffffff;
      --pwc-surface-raise: #fafafa;
      --pwc-text: rgba(0, 0, 0, 0.88);
      --pwc-text-muted: rgba(0, 0, 0, 0.45);
      --pwc-border: #f0f0f0;
      --pwc-border-strong: #d9d9d9;
      --pwc-accent: #1677ff;
      --pwc-accent-hover: #4096ff;
      --pwc-focus: 0 0 0 2px rgba(5, 145, 255, 0.12);
      --pwc-radius: 8px;
      --pwc-radius-sm: 8px;
      --pwc-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      --pwc-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --pwc-bg: #141414;
        --pwc-bg-grad: radial-gradient(920px 500px at 100% 0%, rgba(22, 119, 255, 0.12) 0%, transparent 48%),
          radial-gradient(720px 360px at 0% 100%, rgba(114, 46, 209, 0.09) 0%, transparent 54%);
        --pwc-surface: #1f1f1f;
        --pwc-surface-raise: #262626;
        --pwc-text: rgba(255, 255, 255, 0.85);
        --pwc-text-muted: rgba(255, 255, 255, 0.45);
        --pwc-border: #303030;
        --pwc-border-strong: #434343;
        --pwc-accent: #1668dc;
        --pwc-accent-hover: #3c89e8;
        --pwc-focus: 0 0 0 2px rgba(22, 104, 220, 0.2);
        --pwc-shadow: 0 1px 2px rgba(0, 0, 0, 0.16);
      }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
      font-size: 14px;
      line-height: 1.5715;
      color: var(--pwc-text);
      background: var(--pwc-bg);
      background-image: var(--pwc-bg-grad);
    }
    .pwc-shell { max-width: 48rem; margin: 0 auto; padding: 24px 20px 32px; }
    /* Wider when using the stages option (side Steps + main column) */
    .pwc-shell--stages { max-width: 64rem; }
    .pwc-card {
      background: var(--pwc-surface);
      border: 1px solid var(--pwc-border);
      border-radius: var(--pwc-radius);
      box-shadow: var(--pwc-shadow);
      padding: 0;
      overflow: hidden;
    }
    /* Sidebar: like antd layout — no extra card box, only a split line + air */
    .pwc-wizard--with-sidebar {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: 100%;
      gap: 0 24px;
    }
    .pwc-wizard-sidenav {
      flex: 0 0 auto;
      width: 16.5rem;
      min-width: 12rem;
      max-width: 19rem;
      padding: 4px 16px 4px 0;
      background: transparent;
      border: none;
      border-radius: 0;
      border-right: 1px solid var(--pwc-ad-color-split);
      position: sticky;
      top: 4px;
      align-self: flex-start;
      max-height: min(70vh, 30rem);
      overflow-y: auto;
    }
    .pwc-wizard-sidenav .pwc-ad-steps { margin: 0; padding: 0; }
    .pwc-wizard-sidenav .pwc-ad-steps--vertical { margin: 0; }
    .pwc-wizard-sidenav .pwc-ad-steps--vertical .pwc-ad-steps-item { padding: 0 0 10px; }
    .pwc-wizard-sidenav .pwc-ad-vert { width: var(--pwc-ad-icon-size); min-width: var(--pwc-ad-icon-size); }
    .pwc-wizard-sidenav .pwc-ad-steps--vertical .pwc-ad-steps-item-title {
      -webkit-line-clamp: 2;
    }
    .pwc-wizard-sidenav .pwc-ad-steps-item--process .pwc-ad-steps-item-title { font-weight: 500; }
    .pwc-wizard-main {
      flex: 1;
      min-width: 0;
    }
    @media (max-width: 34rem) {
      .pwc-shell { padding: 16px 14px 24px; }
      .pwc-card { padding: 0; }
      .pwc-wizard--with-sidebar { flex-direction: column; gap: 16px; }
      .pwc-wizard-sidenav {
        position: static;
        max-height: none;
        width: 100%;
        max-width: none;
        padding: 0 0 12px 0;
        border-right: none;
        border-bottom: 1px solid var(--pwc-ad-color-split);
      }
    }
    .pwc-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--pwc-border);
      background: var(--pwc-surface);
    }
    .pwc-header h1 {
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.2666666667;
      margin: 0 0 8px 0;
    }
    .pwc-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .pwc-pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--pwc-accent);
      background: color-mix(in srgb, var(--pwc-accent) 12%, var(--pwc-surface));
      border: 1px solid color-mix(in srgb, var(--pwc-accent) 25%, var(--pwc-border));
      padding: 0 12px;
      border-radius: 999px;
    }
    .hint { font-size: 14px; line-height: 1.5715; color: var(--pwc-text-muted); margin: 0; }
    .hint code { font-family: var(--pwc-mono); font-size: 0.8em; padding: 0.1em 0.3em; border-radius: 4px; background: var(--pwc-surface-raise); border: 1px solid var(--pwc-border); }
    #pwcForm {
      margin-top: 0;
      padding: 24px 24px 20px;
    }
    @media (max-width: 34rem) {
      .pwc-header {
        padding: 16px 16px 14px;
      }
      #pwcForm {
        padding: 18px 16px 16px;
      }
    }
    .pwc-wizard { width: 100%; }
    /*
     * Steps visual alignment with Ant Design 5/6
     * @see https://ant.design/components/steps-cn
     * (iconSize 32, iconFontSize 14, colorText / colorTextDescription, colorSplit rail, colorBorder, etc.)
     */
    :root {
      /* Primary + hover/active (antd defaultAlgorithm: colorPrimaryHover / colorPrimaryActive) */
      --pwc-ad-color-primary: #1677ff;
      --pwc-ad-color-primary-hover: #4096ff;
      --pwc-ad-color-primary-active: #0958d9;
      --pwc-ad-color-text: rgba(0, 0, 0, 0.88);
      --pwc-ad-color-text-description: rgba(0, 0, 0, 0.45);
      --pwc-ad-color-wait: rgba(0, 0, 0, 0.25);
      --pwc-ad-color-border: #d9d9d9;
      --pwc-ad-color-split: #f0f0f0;
      --pwc-ad-color-container: #ffffff;
      --pwc-ad-color-fill-alter: #fafafa;
      --pwc-ad-wait-icon-bg: rgba(0, 0, 0, 0.04);
      --pwc-ad-icon-size: 32px;
      --pwc-ad-icon-font-size: 14px;
      --pwc-ad-title-font-size: 14px;
      --pwc-ad-line-height: 1.5715;
      /* antd Alert type=error (colorErrorBg / colorErrorBorder / colorError) */
      --pwc-ad-alert-error-bg: #fff2f0;
      --pwc-ad-alert-error-border: #ffccc7;
      --pwc-ad-alert-error-text: rgba(0, 0, 0, 0.88);
      --pwc-ad-alert-error-icon: #ff4d4f;
      /* antd Alert type=success (colorSuccessBg / colorSuccessBorder / colorSuccess) */
      --pwc-ad-alert-success-bg: #f6ffed;
      --pwc-ad-alert-success-border: #b7eb8f;
      --pwc-ad-alert-success-text: rgba(0, 0, 0, 0.88);
      --pwc-ad-alert-success-icon: #52c41a;
      /* antd Form validation (colorError) */
      --pwc-form-color-error: #ff4d4f;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --pwc-ad-color-text: rgba(255, 255, 255, 0.85);
        --pwc-ad-color-text-description: rgba(255, 255, 255, 0.45);
        --pwc-ad-color-wait: rgba(255, 255, 255, 0.3);
        --pwc-ad-color-border: #424242;
        --pwc-ad-color-split: #303030;
        --pwc-ad-color-container: #1f1f1f;
        --pwc-ad-color-fill-alter: #1a1a1a;
        --pwc-ad-color-primary: #1668dc;
        --pwc-ad-color-primary-hover: #3c89e8;
        --pwc-ad-color-primary-active: #124699;
        --pwc-ad-wait-icon-bg: rgba(255, 255, 255, 0.08);
        --pwc-ad-alert-error-bg: #2a1215;
        --pwc-ad-alert-error-border: #58181c;
        --pwc-ad-alert-error-text: rgba(255, 255, 255, 0.85);
        --pwc-ad-alert-error-icon: #d32029;
        --pwc-ad-alert-success-bg: #162312;
        --pwc-ad-alert-success-border: #274916;
        --pwc-ad-alert-success-text: rgba(255, 255, 255, 0.85);
        --pwc-ad-alert-success-icon: #49aa19;
        --pwc-form-color-error: #d32029;
      }
    }
    /* antd Alert type=error — @see https://ant.design/components/alert */
    .pwc-ad-status { margin: 16px 0 0; min-height: 0; }
    .pwc-ad-status--empty:empty { margin-top: 8px; }
    .pwc-ad-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0 0;
      padding: 9px 12px;
      font-size: 14px;
      line-height: 1.5715;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .pwc-ad-alert--error {
      color: var(--pwc-ad-alert-error-text);
      background: var(--pwc-ad-alert-error-bg);
      border: 1px solid var(--pwc-ad-alert-error-border);
    }
    .pwc-ad-alert--success {
      color: var(--pwc-ad-alert-success-text);
      background: var(--pwc-ad-alert-success-bg);
      border: 1px solid var(--pwc-ad-alert-success-border);
    }
    .pwc-ad-alert .pwc-ad-alert__icon {
      display: inline-flex;
      line-height: 0;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .pwc-ad-alert--error .pwc-ad-alert__icon { color: var(--pwc-ad-alert-error-icon); }
    .pwc-ad-alert--success .pwc-ad-alert__icon { color: var(--pwc-ad-alert-success-icon); }
    .pwc-ad-alert .pwc-ad-alert__inner { flex: 1; min-width: 0; }
    .pwc-ad-alert .pwc-ad-alert__title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }
    .pwc-ad-alert--error .pwc-ad-alert__title { color: var(--pwc-ad-alert-error-text); }
    .pwc-ad-alert--success .pwc-ad-alert__title { color: var(--pwc-ad-alert-success-text); }
    .pwc-ad-alert .pwc-ad-alert__desc {
      font-size: 14px;
      font-weight: 400;
      margin: 0;
    }
    .pwc-ad-alert--error .pwc-ad-alert__desc { color: var(--pwc-ad-color-text-description); }
    .pwc-ad-alert--success .pwc-ad-alert__desc { color: var(--pwc-ad-color-text-description); }
    .pwc-ad-hint--plain {
      font-size: 12px;
      color: var(--pwc-text-muted);
      margin: 16px 0 0;
    }
    .pwc-ad-steps { width: 100%; margin: 0; padding: 0; }
    .pwc-ad-steps--vertical { max-width: 100%; }
    .pwc-ad-steps-list--vertical {
      list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; width: 100%;
      gap: 0; align-items: stretch;
    }
    .pwc-ad-steps--vertical .pwc-ad-steps-item {
      margin: 0; text-align: left; box-sizing: border-box; padding: 0 0 12px;
    }
    .pwc-ad-steps--vertical .pwc-ad-steps-item:last-child { padding-bottom: 0; }
    .pwc-ad-steps--vertical .pwc-ad-steps-item-row {
      display: flex; flex-direction: row; align-items: flex-start; gap: 12px; width: 100%;
    }
    .pwc-ad-vert {
      display: flex; flex-direction: column; align-items: center; width: var(--pwc-ad-icon-size);
      flex-shrink: 0; min-width: var(--pwc-ad-icon-size);
    }
    .pwc-ad-vert__icon { width: var(--pwc-ad-icon-size); height: var(--pwc-ad-icon-size); flex-shrink: 0; line-height: 0; }
    .pwc-ad-vert__tail {
      flex: 1 1 auto; width: 1px; min-height: 8px; margin-top: 4px; align-self: center;
      background: var(--pwc-ad-color-split); border-radius: 0; transition: background 0.2s;
    }
    .pwc-ad-vert__tail[data-pwc-conn="done"] { background: var(--pwc-ad-color-primary); }
    .pwc-ad-vert__main {
      flex: 1; min-width: 0; padding-top: 0; text-align: left; align-self: flex-start;
    }
    .pwc-ad-icon {
      display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;
      width: var(--pwc-ad-icon-size); height: var(--pwc-ad-icon-size); border-radius: 50%;
      border: 1px solid transparent; background-clip: padding-box;
      background: var(--pwc-ad-color-container);
      color: var(--pwc-ad-color-wait);
      font-size: var(--pwc-ad-icon-font-size);
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
      line-height: 1;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    .pwc-ad-icon-num { line-height: 1; }
    .pwc-ad-steps-item--wait .pwc-ad-icon {
      background: var(--pwc-ad-wait-icon-bg);
      border: 1px solid transparent;
      color: var(--pwc-ad-color-text-description);
    }
    @media (prefers-color-scheme: dark) {
      .pwc-ad-steps-item--wait .pwc-ad-icon { color: var(--pwc-ad-color-text-description); }
    }
    /* antd process: solid primary, white number (not outline) */
    .pwc-ad-steps-item--process .pwc-ad-icon {
      background: var(--pwc-ad-color-primary);
      border: 1px solid var(--pwc-ad-color-primary);
      color: #fff;
    }
    .pwc-ad-icon--finish {
      border: 1px solid var(--pwc-ad-color-primary) !important;
      background: var(--pwc-ad-color-primary) !important; color: #fff !important;
    }
    .pwc-ad-icon-check-svg { display: block; margin: 0 auto; }
    .pwc-ad-steps--vertical .pwc-ad-steps-item-title {
      font-size: var(--pwc-ad-title-font-size);
      line-height: var(--pwc-ad-line-height);
      color: var(--pwc-ad-color-text-description);
      margin: 0; padding: 0; max-width: 100%;
      font-weight: 400;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
      overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    }
    .pwc-ad-steps-item--process .pwc-ad-steps-item-title {
      color: var(--pwc-ad-color-text);
      font-weight: 500;
    }
    .pwc-ad-steps-item--finish .pwc-ad-steps-item-title { color: var(--pwc-ad-color-text-description); font-weight: 400; }
    .pwc-ad-steps-item--wait .pwc-ad-steps-item-title { color: var(--pwc-ad-color-text-description); }
    .pwc-ad-steps--vertical .pwc-ad-steps-item-description {
      font-size: 12px;
      line-height: 1.5;
      color: var(--pwc-ad-color-text-description);
      margin: 4px 0 0 0;
      max-width: 100%;
      font-weight: 400;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
      overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .pwc-ad-steps-item--process .pwc-ad-steps-item-description { color: var(--pwc-ad-color-text-description); }
    .pwc-ad-steps-item--wait .pwc-ad-steps-item-description { color: var(--pwc-ad-color-text-description); }
    .pwc-ad-steps-item--finish .pwc-ad-steps-item-description { color: var(--pwc-ad-color-text-description); }
    .pwc-step[hidden] { display: none !important; }
    /* antd Form / Typography: section title */
    .pwc-step h2.pwc-step-title {
      font-size: 20px;
      font-weight: 500;
      line-height: 1.4;
      letter-spacing: 0;
      color: var(--pwc-ad-color-text);
      margin: 0 0 24px 0;
    }
    @media (prefers-color-scheme: dark) {
      .pwc-step h2.pwc-step-title { color: var(--pwc-ad-color-text); }
    }
    /* antd Form.Item: no nested cards — spacing + normal labels */
    .pwc-l {
      display: block;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.5715;
      color: var(--pwc-ad-color-text);
      margin: 0 0 8px 0;
    }
    label { display: block; }
    .pwc-step [data-pwc-wrap] {
      margin: 0 0 24px 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
    }
    .pwc-step h2 + [data-pwc-wrap] { margin-top: 0; }
    .pwc-bool-wrap { padding: 0; }
    .pwc-bool-wrap label { display: flex; flex-direction: row; align-items: center; flex-wrap: nowrap; gap: 10px; }
    .pwc-bool-wrap .pwc-l { display: inline; margin-bottom: 0; font-weight: 400; }
    .pwc-bool-wrap input[type=checkbox] { margin: 0; flex-shrink: 0; width: 16px; height: 16px; accent-color: var(--pwc-ad-color-primary); border-radius: 4px; cursor: pointer; }
    .pwc-radio-group { display: grid; gap: 12px; }
    .pwc-radio-option {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--pwc-ad-color-border);
      border-radius: 8px;
      background: var(--pwc-ad-color-container);
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .pwc-radio-option:hover {
      border-color: var(--pwc-ad-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 8%, transparent);
      background: color-mix(in srgb, var(--pwc-ad-color-primary) 2%, var(--pwc-ad-color-container));
    }
    .pwc-radio-option--disabled {
      cursor: not-allowed;
      background: var(--pwc-ad-color-fill-alter);
    }
    .pwc-radio-option--disabled:hover {
      border-color: var(--pwc-ad-color-border);
      box-shadow: none;
      background: var(--pwc-ad-color-fill-alter);
    }
    .pwc-radio-input {
      margin: 3px 0 0;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      accent-color: var(--pwc-ad-color-primary);
      cursor: pointer;
    }
    .pwc-radio-option--disabled .pwc-radio-input {
      cursor: not-allowed;
    }
    .pwc-radio-option-body { min-width: 0; }
    .pwc-radio-option-label {
      display: block;
      font-size: 14px;
      line-height: 1.5715;
      color: var(--pwc-ad-color-text);
    }
    .pwc-radio-option--disabled .pwc-radio-option-label {
      color: color-mix(in srgb, var(--pwc-ad-color-text) 55%, transparent);
    }
    .pwc-radio-option-hint {
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--pwc-ad-color-text-description);
    }
    .pwc-radio-option--disabled .pwc-radio-option-hint {
      color: color-mix(in srgb, var(--pwc-ad-color-text-description) 70%, transparent);
    }
    .pwc-radio-input:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 20%, transparent);
      border-radius: 999px;
    }
    .pwc-radio-option:has(.pwc-radio-input:checked) {
      border-color: var(--pwc-ad-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 12%, transparent);
      background: color-mix(in srgb, var(--pwc-ad-color-primary) 5%, var(--pwc-ad-color-container));
    }
    .pwc-radio-option--disabled:has(.pwc-radio-input:checked) {
      border-color: var(--pwc-ad-color-border);
      box-shadow: none;
      background: var(--pwc-ad-color-fill-alter);
    }
    .pwc-form-item-has-error .pwc-radio-option {
      border-color: var(--pwc-form-color-error);
    }
    .pwc-form-item-has-error .pwc-radio-option:has(.pwc-radio-input:checked) {
      background: color-mix(in srgb, var(--pwc-form-color-error) 5%, var(--pwc-ad-color-container));
    }
    /* antd Form.Item: label + control + explain — @see https://ant.design/components/form */
    .pwc-form-item { margin: 0 0 24px 0; }
    .pwc-form-item-label { margin: 0; padding: 0; }
    .pwc-form-item-control { width: 100%; }
    .pwc-form-item--bool { margin: 0 0 24px 0; }
    .pwc-form-item--bool .pwc-bool-wrap { margin: 0; }
    .pwc-input-affix-wrapper { position: relative; display: block; width: 100%; }
    .pwc-form-item-suffix:empty { display: none; }
    .pwc-form-item-suffix {
      position: absolute; z-index: 1; right: 11px; top: 50%;
      transform: translateY(-50%);
      color: var(--pwc-form-color-error);
      display: flex; align-items: center; line-height: 0;
      pointer-events: none;
    }
    .pwc-input-affix-wrapper .pwc-form-input { padding-right: 32px; }
    .pwc-input-affix-wrapper--select .pwc-form-input { padding-right: 32px; }
    .pwc-form-item-explain { font-size: 14px; line-height: 1.5715; margin-top: 4px; clear: both; }
    .pwc-form-item-explain[hidden] { display: none !important; }
    .pwc-form-item-explain:not([hidden]) { color: var(--pwc-form-color-error); }
    .pwc-form-item-has-error .pwc-form-input { border-color: var(--pwc-form-color-error) !important; }
    .pwc-form-item-has-error .pwc-form-input:hover { border-color: var(--pwc-form-color-error) !important; }
    .pwc-form-item-has-error .pwc-form-input:focus,
    .pwc-form-item-has-error .pwc-form-input:focus-visible {
      border-color: var(--pwc-form-color-error) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-form-color-error) 20%, transparent) !important;
    }
    .pwc-form-item--bool.pwc-form-item-has-error .pwc-bool-wrap {
      display: inline-block; max-width: 100%;
      padding: 6px 10px; border: 1px solid var(--pwc-form-color-error); border-radius: 6px; box-sizing: border-box;
    }
    .pwc-form-fail__svg { display: block; }
    /* antd Input: single border, 6px radius */
    input.pwc-form-input, select.pwc-form-input, textarea {
      width: 100%;
      margin-top: 0;
      padding: 6px 11px;
      min-height: 40px;
      font: inherit;
      font-size: 14px;
      line-height: 1.5715;
      color: var(--pwc-ad-color-text);
      background: var(--pwc-ad-color-container);
      border: 1px solid var(--pwc-ad-color-border);
      border-radius: 6px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    input.pwc-form-input:hover, select.pwc-form-input:hover, textarea:hover {
      border-color: var(--pwc-ad-color-primary);
    }
    input.pwc-form-input:focus, input.pwc-form-input:focus-visible, select.pwc-form-input:focus, textarea:focus {
      outline: none;
      border-color: var(--pwc-ad-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 16%, transparent);
    }
    input.pwc-form-input::placeholder, textarea::placeholder { color: var(--pwc-ad-color-text-description); }
    input.pwc-form-input:disabled, select.pwc-form-input:disabled, textarea:disabled {
      color: color-mix(in srgb, var(--pwc-ad-color-text) 55%, transparent);
      background: var(--pwc-ad-color-fill-alter);
      cursor: not-allowed;
      border-color: var(--pwc-ad-color-border);
      box-shadow: none;
    }
    select { cursor: pointer; }
    .pwc-wizard-ctl {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 8px;
      margin-top: 28px;
      padding-top: 0;
    }
    .pwc-wizard-ctl .pwc-btn-pager {
      min-height: 40px;
      box-sizing: border-box;
    }
    .pwc-wizard-ctl-spacer { flex: 1 1 auto; min-width: 8px; }
    .pwc-wizard-ctl__submit {
      flex: 0 0 auto;
      width: auto !important;
      min-width: 136px;
    }
    .pwc-btn-pager {
      padding: 4px 15px;
      font: inherit;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.5715;
      color: var(--pwc-ad-color-text);
      background: var(--pwc-ad-color-container);
      border: 1px solid var(--pwc-ad-color-border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pwc-btn-pager:hover {
      color: var(--pwc-ad-color-primary);
      border-color: var(--pwc-ad-color-primary);
      background: var(--pwc-ad-color-container);
    }
    .pwc-btn-pager:active {
      color: var(--pwc-ad-color-primary-active);
      border-color: var(--pwc-ad-color-primary-active);
    }
    .pwc-btn-pager--primary {
      color: #fff;
      background: var(--pwc-ad-color-primary);
      border-color: var(--pwc-ad-color-primary);
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    .pwc-btn-pager--primary:hover {
      color: #fff;
      background: var(--pwc-ad-color-primary-hover);
      border-color: var(--pwc-ad-color-primary-hover);
    }
    .pwc-btn-pager--primary:active {
      color: #fff;
      background: var(--pwc-ad-color-primary-active);
      border-color: var(--pwc-ad-color-primary-active);
    }
    .pwc-btn-pager:focus-visible { outline: none; box-shadow: var(--pwc-focus); }
    .pwc-btn-pager--primary:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 20%, transparent);
    }
    .pwc-wizard-ctl .pwc-btn-submit,
    .pwc-wizard-ctl button.pwc-btn-submit {
      margin: 0;
      height: 40px;
      padding: 4px 15px;
      font: inherit;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.5715;
      color: #fff;
      background: var(--pwc-ad-color-primary);
      border: 1px solid var(--pwc-ad-color-primary);
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 0 color-mix(in srgb, #000 2%, transparent);
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    .pwc-wizard-ctl .pwc-btn-submit:hover, .pwc-wizard-ctl button.pwc-btn-submit:hover {
      background: var(--pwc-ad-color-primary-hover);
      border-color: var(--pwc-ad-color-primary-hover);
    }
    .pwc-wizard-ctl .pwc-btn-submit:active, .pwc-wizard-ctl button.pwc-btn-submit:active {
      background: var(--pwc-ad-color-primary-active);
      border-color: var(--pwc-ad-color-primary-active);
    }
    .pwc-wizard-ctl .pwc-btn-submit:focus-visible, .pwc-wizard-ctl button.pwc-btn-submit:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--pwc-ad-color-primary) 20%, transparent);
    }
    .pwc-btn-pager[hidden], .pwc-btn-submit[hidden] { display: none !important; }
    @media (max-width: 34rem) {
      .pwc-wizard-ctl {
        flex-wrap: wrap;
      }
      .pwc-wizard-ctl-spacer {
        display: none;
      }
      .pwc-wizard-ctl .pwc-btn-pager,
      .pwc-wizard-ctl .pwc-btn-submit {
        flex: 1 1 100%;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="${pwcShellClass}">
    <div class="pwc-card">
      <header class="pwc-header">
        <h1>${escapeHtml(h1)}</h1>
        <p class="hint">${escapeHtml(documentHint)}</p>
      </header>
  <form id="pwcForm" autocomplete="off">
    ${formInner}
  </form>
    </div>
  </div>
  <script>
  (function () {
    var sub = ${JSON.stringify(base + submitPath)};
    var ref = ${JSON.stringify(base + reflowPath)};
    var pwcValStep = ${pwcValStepUrl};
    var pwcValField = ${pwcValFieldUrl};
    var pwcStepMeta = ${JSON.stringify(PWC_FORM_META_STEP)};
    var pwcFieldMeta = ${JSON.stringify(PWC_FORM_META_FIELD)};
    var s = document.getElementById('pwcStatus');
    var wcfg = ${wizardClientJson};
    var uiText = ${uiTextJson};
    var pwcN = wcfg && typeof wcfg.n === 'number' ? wcfg.n : 1;
    var pwcSteps = (wcfg && wcfg.stepDefs) || [];
    var pwcCur = 0;
    var pwcVisibleSteps = [];
    var pwcAdCheck = ${JSON.stringify(PWC_AD_CHECK_SVG)};
    var pwcErrIcon = ${JSON.stringify(PWC_AD_ALERT_ERROR_ICON_SVG)};
    var pwcOkIcon = ${JSON.stringify(PWC_AD_ALERT_SUCCESS_ICON_SVG)};
    var pwcFieldFail = ${JSON.stringify(PWC_FORM_FAIL_ICON_SVG)};
    var pwcCloseTimer = null;
    var pwcCloseProbeTimer = null;
    var pwcFieldReqSeq = {};
    var form = document.getElementById('pwcForm');
    function pwcEsc(t) {
      return String(t == null ? '' : t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
    function pwcSetStatusEmpty() {
      if (!s) { return; }
      s.className = 'pwc-ad-status pwc-ad-status--empty';
      s.setAttribute('role', 'status');
      s.textContent = '';
    }
    function pwcSetStatusHint(msg) {
      if (!s) { return; }
      s.className = 'pwc-ad-hint--plain';
      s.setAttribute('role', 'status');
      s.textContent = String(msg);
    }
    function pwcSetStatusError(message) {
      if (!s) { return; }
      var t = String(message == null ? '' : message)
        .replace(/^\\s*Error:\\s*/i, '');
      s.className = 'pwc-ad-alert pwc-ad-alert--error';
      s.setAttribute('role', 'alert');
      s.innerHTML =
        '<span class="pwc-ad-alert__icon" aria-hidden="true">' + pwcErrIcon + '</span>' +
        '<div class="pwc-ad-alert__inner"><div class="pwc-ad-alert__title">' + pwcEsc(uiText.errorTitle) + '</div>' +
        '<div class="pwc-ad-alert__desc">' + pwcEsc(t) + '</div></div>';
    }
    function pwcSetStatusSuccess(message) {
      if (!s) { return; }
      var t = String(message == null ? '' : message);
      s.className = 'pwc-ad-alert pwc-ad-alert--success';
      s.setAttribute('role', 'status');
      s.innerHTML =
        '<span class="pwc-ad-alert__icon" aria-hidden="true">' + pwcOkIcon + '</span>' +
        '<div class="pwc-ad-alert__inner"><div class="pwc-ad-alert__title">' + pwcEsc(uiText.successTitle) + '</div>' +
        '<div class="pwc-ad-alert__desc">' + pwcEsc(t) + '</div></div>';
    }
    function pwcScheduleWindowClose() {
      if (pwcCloseTimer != null) { clearTimeout(pwcCloseTimer); }
      if (pwcCloseProbeTimer != null) { clearTimeout(pwcCloseProbeTimer); }
      pwcCloseTimer = setTimeout(function () {
        window.close();
        pwcCloseProbeTimer = setTimeout(function () {
          if (!s || document.visibilityState !== 'visible') { return; }
          pwcSetStatusSuccess(uiText.savedCloseBlocked);
        }, 600);
      }, 5000);
    }
    function pwcSetFieldError(key, message) {
      if (!form || !key) { return; }
      var wrap = form.querySelector('[data-pwc-field=\"' + String(key) + '\"]');
      if (!wrap) { return; }
      var ex = wrap.querySelector('[data-pwc-explain]');
      var suf = wrap.querySelector('[data-pwc-suffix]');
      if (message) {
        wrap.classList.add('pwc-form-item-has-error');
        if (ex) {
          ex.textContent = String(message);
          ex.removeAttribute('hidden');
        }
        if (suf) { suf.innerHTML = pwcFieldFail; }
      } else {
        wrap.classList.remove('pwc-form-item-has-error');
        if (ex) {
          ex.textContent = '';
          ex.setAttribute('hidden', '');
        }
        if (suf) { suf.innerHTML = ''; }
      }
    }
    function pwcClearAllFieldErrors() {
      if (!form) { return; }
      var nodes = form.querySelectorAll('[data-pwc-field]');
      for (var i = 0; i < nodes.length; i++) {
        var k = nodes[i].getAttribute('data-pwc-field');
        if (k) { pwcSetFieldError(k, null); }
      }
    }
    function pwcParseErrorBody(x) {
      var msg = String(x);
      var fk = null;
      try {
        var j = JSON.parse(x);
        if (j && j.error) { msg = String(j.error); }
        if (j && j.fieldKey) { fk = String(j.fieldKey); }
      } catch (e) {}
      return { msg: msg, fk: fk };
    }
    function pwcSetFieldDirty(key, dirty) {
      if (!form || !key) { return; }
      var wrap = form.querySelector('[data-pwc-field=\"' + String(key) + '\"]');
      if (!wrap) { return; }
      if (dirty) {
        wrap.setAttribute('data-pwc-dirty', '1');
      } else {
        wrap.removeAttribute('data-pwc-dirty');
      }
    }
    function pwcIsFieldDirty(key) {
      if (!form || !key) { return false; }
      var wrap = form.querySelector('[data-pwc-field=\"' + String(key) + '\"]');
      return !!(wrap && wrap.getAttribute('data-pwc-dirty') === '1');
    }
    function getControl(formEl, k) {
      if (!formEl || !formEl.elements) { return null; }
      var el = formEl.elements[k];
      if (el == null) { return null; }
      if (typeof RadioNodeList !== 'undefined' && el instanceof RadioNodeList) { return el[0] || null; }
      return el;
    }
    function setControlValue(formEl, k, rawVal) {
      if (!formEl || !formEl.elements) { return; }
      var el = formEl.elements[k];
      if (el == null) { return; }
      if (typeof RadioNodeList !== 'undefined' && el instanceof RadioNodeList) {
        var want = rawVal == null ? '' : String(rawVal);
        for (var i = 0; i < el.length; i++) {
          if (el[i]) {
            el[i].checked = el[i].value === want;
          }
        }
        return;
      }
      if (el.type === 'checkbox') {
        el.checked = Boolean(rawVal);
        return;
      }
      el.value = rawVal == null ? '' : String(rawVal);
    }
    function getControlValue(formEl, k) {
      if (!formEl || !formEl.elements) { return undefined; }
      var el = formEl.elements[k];
      if (el == null) { return undefined; }
      if (typeof RadioNodeList !== 'undefined' && el instanceof RadioNodeList) {
        for (var i = 0; i < el.length; i++) {
          if (el[i] && el[i].checked) {
            return el[i].value;
          }
        }
        return el.value || undefined;
      }
      if (el.type === 'checkbox') {
        return !!el.checked;
      }
      return el.value;
    }
    function collect(options) {
      var dirtyOnly = !!(options && options.dirtyOnly);
      var o = {};
      if (!form || !form.elements) { return o; }
      var nodes = form.querySelectorAll('[data-pwc-wrap]');
      for (var i = 0; i < nodes.length; i++) {
        var w = nodes[i];
        if (w.style.display === 'none') { continue; }
        var k = w.getAttribute('data-pwc-wrap');
        if (!k) { continue; }
        if (dirtyOnly && !pwcIsFieldDirty(k)) { continue; }
        var inp = getControl(form, k);
        if (inp == null) { continue; }
        var rawVal = getControlValue(form, k);
        if (inp.type === 'checkbox') {
          o[k] = !!inp.checked;
        } else if (inp.type === 'radio') {
          o[k] = rawVal;
        } else if (inp.type === 'number') {
          var sv = (rawVal != null && String(rawVal) !== '') ? String(rawVal).trim() : '';
          if (sv === '' || sv === '-' || sv === '+') {
            o[k] = 0;
          } else {
            var n0 = parseInt(sv, 10);
            o[k] = (typeof n0 === 'number' && !isNaN(n0)) ? n0 : 0;
          }
        } else {
          o[k] = rawVal;
        }
      }
      return o;
    }
    function reflow() {
      clearTimeout(t);
      return fetch(ref, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collect({ dirtyOnly: true })) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var sh = d.show || {};
          var vals = d.values || {};
          if (!form) { return; }
          form.querySelectorAll('[data-pwc-wrap]').forEach(function (w) {
            var k = w.getAttribute('data-pwc-wrap');
            var wasHidden = w.style.display === 'none';
            var hidden = k != null && sh[k] === false;
            w.style.display = hidden ? 'none' : 'block';
            var ctrls = w.querySelectorAll('input, select, textarea');
            for (var i = 0; i < ctrls.length; i++) {
              ctrls[i].disabled = hidden || ctrls[i].getAttribute('data-pwc-static-disabled') === '1';
            }
            if (!hidden && k && !pwcIsFieldDirty(k) && Object.prototype.hasOwnProperty.call(vals, k)) {
              setControlValue(form, k, vals[k]);
            }
          });
          pwcRefreshVisibleSteps();
        })
        .catch(function () {});
    }
    var t;
    function scheduleReflow() { clearTimeout(t); t = setTimeout(reflow, 120); }
    function pwcStepHasVisibleFields(stepIndex) {
      if (!form || !pwcSteps || stepIndex < 0 || stepIndex >= pwcSteps.length) {
        return false;
      }
      var st = pwcSteps[stepIndex];
      if (!st || !st.keys || st.keys.length === 0) {
        return false;
      }
      for (var i = 0; i < st.keys.length; i++) {
        var key = st.keys[i];
        var wrap = form.querySelector('[data-pwc-wrap=\"' + String(key) + '\"]');
        if (wrap && wrap.style.display !== 'none') {
          return true;
        }
      }
      return false;
    }
    function pwcRefreshVisibleSteps() {
      var prevCur = pwcCur;
      pwcVisibleSteps = [];
      for (var i = 0; i < pwcN; i++) {
        if (i === 0 || pwcStepHasVisibleFields(i)) {
          pwcVisibleSteps.push(i);
        }
      }
      if (pwcVisibleSteps.length === 0) {
        pwcVisibleSteps = [0];
      }
      var items = document.querySelectorAll('.pwc-ad-steps-item[data-pwc-step-idx]');
      for (var j = 0; j < items.length; j++) {
        var li = items[j];
        var idx = parseInt(li.getAttribute('data-pwc-step-idx') || '0', 10);
        li.hidden = pwcVisibleSteps.indexOf(idx) === -1;
      }
      var sections = document.querySelectorAll('.pwc-step');
      for (var k = 0; k < sections.length; k++) {
        var el = sections[k];
        var si = parseInt(el.getAttribute('data-pwc-step') || '0', 10);
        if (pwcVisibleSteps.indexOf(si) === -1) {
          el.setAttribute('hidden', '');
          el.classList.remove('pwc-step--active');
        }
      }
      if (pwcVisibleSteps.indexOf(pwcCur) === -1) {
        pwcCur = pwcVisibleSteps[0];
      }
      pwcRenderCurrentStep(pwcCur, { preserveErrors: pwcCur === prevCur });
    }
    function pwcVisibleStepPosition(stepIndex) {
      return pwcVisibleSteps.indexOf(stepIndex);
    }
    function pwcVisiblePrev(stepIndex) {
      var pos = pwcVisibleStepPosition(stepIndex);
      if (pos <= 0) {
        return stepIndex;
      }
      return pwcVisibleSteps[pos - 1];
    }
    function pwcVisibleNext(stepIndex) {
      var pos = pwcVisibleStepPosition(stepIndex);
      if (pos === -1 || pos >= pwcVisibleSteps.length - 1) {
        return stepIndex;
      }
      return pwcVisibleSteps[pos + 1];
    }
    function pwcRenderCurrentStep(n, opts) {
      pwcCur = n;
      if (pwcN <= 1) { return; }
      if (!(opts && opts.preserveErrors)) {
        pwcClearAllFieldErrors();
      }
      var sections = document.querySelectorAll('.pwc-step');
      for (var i = 0; i < sections.length; i++) {
        var el = sections[i];
        var si = parseInt(el.getAttribute('data-pwc-step') || '0', 10);
        if (pwcVisibleSteps.indexOf(si) === -1) {
          el.setAttribute('hidden', '');
          el.classList.remove('pwc-step--active');
        } else if (si === n) {
          el.removeAttribute('hidden');
          el.classList.add('pwc-step--active');
        } else {
          el.setAttribute('hidden', '');
          el.classList.remove('pwc-step--active');
        }
      }
      pwcSyncAntStepsUI(n);
      var b = document.getElementById('pwcBack');
      var nx = document.getElementById('pwcNext');
      var sm = document.getElementById('pwcFormSubmit');
      var visiblePos = pwcVisibleStepPosition(n);
      if (b) { b.hidden = visiblePos <= 0; }
      if (nx) { nx.hidden = visiblePos >= pwcVisibleSteps.length - 1; }
      if (sm) { sm.hidden = visiblePos < pwcVisibleSteps.length - 1; }
    }
    function pwcSyncAntStepsUI(cur) {
      if (pwcN <= 1) { return; }
      var items = document.querySelectorAll('.pwc-ad-steps-item[data-pwc-step-idx]');
      for (var k = 0; k < items.length; k++) {
        var li = items[k];
        var i = parseInt(li.getAttribute('data-pwc-step-idx') || '0', 10);
        if (pwcVisibleSteps.indexOf(i) === -1) {
          continue;
        }
        var curPos = pwcVisibleStepPosition(cur);
        var itemPos = pwcVisibleStepPosition(i);
        var st = itemPos < curPos ? 'finish' : (i === cur ? 'process' : 'wait');
        li.setAttribute('data-pwc-state', st);
        li.setAttribute('aria-current', st === 'process' ? 'step' : 'false');
        li.className = 'pwc-ad-steps-item pwc-ad-steps-item--' + st;
        var iconWrap = li.querySelector('.pwc-ad-vert__icon');
        if (iconWrap) {
          if (st === 'finish') {
            iconWrap.innerHTML = '<span class="pwc-ad-icon pwc-ad-icon--finish" aria-label="done">' + pwcAdCheck + '</span>';
          } else {
            var num = itemPos + 1;
            iconWrap.innerHTML = '<span class="pwc-ad-icon" aria-label="' + num + '"><span class="pwc-ad-icon-num">' + num + '</span></span>';
          }
        }
      }
      var vtails = document.querySelectorAll('.pwc-ad-vert__tail[data-pwc-vtail]');
      for (var v = 0; v < vtails.length; v++) {
        var vt = vtails[v];
        var vi = parseInt(vt.getAttribute('data-pwc-vtail') || '0', 10);
        if (pwcVisibleSteps.indexOf(vi) === -1 || pwcVisibleSteps.indexOf(vi + 1) === -1) {
          vt.hidden = true;
          continue;
        }
        vt.hidden = false;
        vt.setAttribute('data-pwc-conn', pwcVisibleStepPosition(vi) < pwcVisibleStepPosition(cur) ? 'done' : 'todo');
      }
    }
    function pwcSetStep(n) {
      if (pwcVisibleSteps.indexOf(n) === -1) {
        return;
      }
      pwcRenderCurrentStep(n, { preserveErrors: n === pwcCur });
      reflow();
    }
    function validateCurrentStep() {
      if (!form || pwcN <= 1) { return true; }
      var st = pwcSteps[pwcCur];
      if (!st || !st.keys) { return true; }
      for (var a = 0; a < st.keys.length; a++) {
        pwcSetFieldError(st.keys[a], null);
      }
      for (var j = 0; j < st.keys.length; j++) {
        var k = st.keys[j];
        var w = form.querySelector('[data-pwc-wrap=\"' + k + '\"]');
        if (!w || w.style.display === 'none') { continue; }
        var inp = getControl(form, k);
        if (inp == null) { continue; }
        if (typeof inp.checkValidity === 'function' && !inp.checkValidity()) {
            var vm = (typeof inp.validationMessage === 'string' && inp.validationMessage) ? inp.validationMessage : uiText.invalidValue;
            pwcSetFieldError(k, vm);
          if (typeof inp.focus === 'function') { inp.focus(); }
          return false;
        }
      }
      return true;
    }
    function pwcNextPayload() {
      var o = collect();
      o[pwcStepMeta] = pwcCur;
      return o;
    }
    function pwcFieldPayload(key) {
      var o = collect();
      o[pwcFieldMeta] = key;
      return o;
    }
    function pwcValidateField(key) {
      if (!form || !key || pwcValField == null) { return Promise.resolve(); }
      var wrap = form.querySelector('[data-pwc-wrap=\"' + String(key) + '\"]');
      if (!wrap || wrap.style.display === 'none') { return Promise.resolve(); }
      var reqSeq = (pwcFieldReqSeq[key] || 0) + 1;
      pwcFieldReqSeq[key] = reqSeq;
      return fetch(pwcValField, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwcFieldPayload(key))
      })
        .then(function (r) {
          if (!r.ok) {
            return r.text().then(function (x) {
              var pe = pwcParseErrorBody(x);
              var e = new Error(pe.msg || String(r.status));
              e.pwcFieldKey = pe.fk;
              throw e;
            });
          }
          return r.json();
        })
        .then(function () {
          if (pwcFieldReqSeq[key] !== reqSeq) { return; }
          pwcSetFieldError(key, null);
        })
        .catch(function (err) {
          if (pwcFieldReqSeq[key] !== reqSeq) { return; }
          if (err && err.pwcFieldKey) {
            pwcSetFieldError(err.pwcFieldKey, err.message || String(err));
            return;
          }
          pwcSetStatusError(err && err.message ? err.message : err);
        });
    }
    function pwcTryAdvanceNext() {
      if (pwcVisibleStepPosition(pwcCur) >= pwcVisibleSteps.length - 1) { return Promise.resolve(); }
      if (!validateCurrentStep()) { return Promise.resolve(); }
      if (pwcValStep == null) {
        return reflow().then(function () { pwcSetStep(pwcVisibleNext(pwcCur)); });
      }
      pwcSetStatusHint(uiText.checking);
      return fetch(pwcValStep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwcNextPayload())
      })
        .then(function (r) {
          if (!r.ok) {
            return r.text().then(function (x) {
              var pe = pwcParseErrorBody(x);
              var e = new Error(pe.msg || String(r.status));
              e.pwcFieldKey = pe.fk;
              throw e;
            });
          }
          return r.json();
        })
        .then(function () {
          pwcSetStatusEmpty();
          return reflow().then(function () { pwcSetStep(pwcVisibleNext(pwcCur)); });
        })
        .catch(function (err) {
          if (err && err.pwcFieldKey) {
            pwcSetFieldError(err.pwcFieldKey, err.message || String(err));
            pwcSetStatusEmpty();
            var f0 = getControl(form, err.pwcFieldKey);
            if (f0 && typeof f0.focus === 'function') { f0.focus(); }
            return;
          }
          pwcSetStatusError(err && err.message ? err.message : err);
        });
    }
    if (form) {
      function pwcOnFieldTouched(e) {
        var t = e.target;
        if (t && t.name) {
          pwcSetFieldDirty(t.name, true);
          pwcSetFieldError(t.name, null);
        }
      }
      form.addEventListener('input', function (e) { pwcOnFieldTouched(e); scheduleReflow(); });
      form.addEventListener('change', function (e) {
        pwcOnFieldTouched(e);
        scheduleReflow();
        var t = e.target;
        if (t && t.name) {
          void pwcValidateField(t.name);
        }
      });
      form.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || pwcN <= 1) { return; }
        if (e.target && e.target.tagName === 'TEXTAREA') { return; }
        if (pwcCur < pwcN - 1) {
          e.preventDefault();
          void pwcTryAdvanceNext();
        }
      });
    }
    var pwcBack = document.getElementById('pwcBack');
    if (pwcBack) { pwcBack.addEventListener('click', function () { if (pwcVisibleStepPosition(pwcCur) > 0) { pwcSetStep(pwcVisiblePrev(pwcCur)); } }); }
    var pwcNext = document.getElementById('pwcNext');
    if (pwcNext) { pwcNext.addEventListener('click', function () { void pwcTryAdvanceNext(); }); }
    pwcRefreshVisibleSteps();
    if (form) { setTimeout(function () { reflow(); }, 0); }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (pwcN > 1 && pwcVisibleStepPosition(pwcCur) < pwcVisibleSteps.length - 1) { return; }
        pwcSetStatusHint(uiText.sending);
        pwcClearAllFieldErrors();
        fetch(sub, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collect()) })
          .then(function (r) {
            if (!r.ok) {
              return r.text().then(function (x) {
                var pe = pwcParseErrorBody(x);
                var e = new Error(pe.msg || String(r.status));
                e.pwcFieldKey = pe.fk;
                throw e;
              });
            }
            return r.json();
          })
          .then(function () {
            pwcSetStatusSuccess(uiText.savedAndClosing);
            pwcScheduleWindowClose();
          })
          .catch(function (err) {
            if (err && err.pwcFieldKey) {
              pwcSetFieldError(err.pwcFieldKey, err.message || String(err));
              pwcSetStatusEmpty();
              var f1 = getControl(form, err.pwcFieldKey);
              if (f1 && typeof f1.focus === 'function') { f1.focus(); }
              return;
            }
            pwcSetStatusError(err && err.message ? err.message : err);
          });
      });
    }
  })();
  <\/script>
</body>
</html>`;
      return page;
    };

    server = createServer((req, res) => {
      if (
        !req.socket.remoteAddress ||
        !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
      ) {
        res.writeHead(403).end();
        return;
      }

      if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
        const addr = server?.address();
        const port = typeof addr === 'object' && addr ? Number(addr.port) : 0;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(servePage(port));
        return;
      }

      if (req.method === 'POST' && req.url === reflowPath) {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c as Buffer));
        req.on('end', () => {
          try {
            const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
            const { show, values } = reflowWebFormState(catalog, readFormFromClient(raw), userSeed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ show, values }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ show: {}, values: {} }));
          }
        });
        return;
      }

      if (req.method === 'POST' && req.url === resolveValidateStepPath) {
        if (pwcNSteps <= 1) {
          res.writeHead(404).end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c as Buffer));
        req.on('end', () => {
          void (async () => {
            try {
              const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
              const sidx = raw[PWC_FORM_META_STEP];
              const step =
                typeof sidx === 'number' && Number.isFinite(sidx)
                  ? sidx
                  : typeof sidx === 'string' && sidx.length > 0
                    ? Number.parseInt(sidx, 10)
                    : NaN;
              if (!Number.isInteger(step) || step < 0 || step >= pwcStepDefs.length) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: t('promptCatalog.web.invalidStep') }));
                return;
              }
              const { error, fieldKey } = await buildWebPresetFromBody(
                catalog,
                readFormFromClient(readFormFromClientStrippingPwcMeta(raw)),
                userSeed,
                { scopeKeys: new Set(pwcStepDefs[step].keys), locale },
              );
              if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify(
                    fieldKey ? { ok: false, error, fieldKey } : { ok: false, error },
                  ),
                );
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: t('promptCatalog.web.invalidRequest') }));
            }
          })();
        });
        return;
      }

      if (req.method === 'POST' && req.url === resolveValidateFieldPath) {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c as Buffer));
        req.on('end', () => {
          void (async () => {
            try {
              const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
              const fieldKeyRaw = raw[PWC_FORM_META_FIELD];
              const fieldKey =
                typeof fieldKeyRaw === 'string' && fieldKeyRaw.trim().length > 0
                  ? fieldKeyRaw.trim()
                  : '';
              if (!fieldKey || !Object.prototype.hasOwnProperty.call(catalog, fieldKey)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: t('promptCatalog.web.invalidField') }));
                return;
              }
              const { error } = await buildWebPresetFromBody(
                catalog,
                readFormFromClient(readFormFromClientStrippingPwcMeta(raw)),
                userSeed,
                { scopeKeys: new Set([fieldKey]), locale },
              );
              if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error, fieldKey }));
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: t('promptCatalog.web.invalidRequest') }));
            }
          })();
        });
        return;
      }

      if (req.method === 'POST' && req.url === submitPath) {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c as Buffer));
        req.on('end', () => {
          void (async () => {
            try {
              const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
              const { preset, error, fieldKey } = await buildWebPresetFromBody(
                catalog,
                readFormFromClient(raw),
                userSeed,
                { locale },
              );
              if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify(
                    fieldKey ? { ok: false, error, fieldKey } : { ok: false, error },
                  ),
                );
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }), () => {
                if (timeoutId !== undefined) {
                  clearTimeout(timeoutId);
                  timeoutId = undefined;
                }
                if (server) {
                  closePromptWebUiServer(server, () => resolve(preset));
                  return;
                }
                resolve(preset);
              });
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'text/plain' });
              res.end(t('promptCatalog.web.invalidRequest'));
            }
          })();
        });
        return;
      }

      if (req.method === 'GET' && req.url === '/favicon.ico') {
        res.writeHead(204).end();
        return;
      }

      res.writeHead(404).end();
    });

    server.listen(options.port ?? 0, host, () => {
      const addr = server?.address();
      if (typeof addr !== 'object' || !addr) {
        rejectAndClose(new Error('Failed to bind HTTP server'));
        return;
      }
      const port = addr.port;
      const startUrl = `http://${host}:${port}/`;
      options.onServerStart?.({ host, port, url: startUrl });
      try {
        openUrlInDefaultBrowser(startUrl);
      } catch (e) {
        (options.onOpenBrowserError ?? ((u, err) => console.warn(String(err), u)))(startUrl, e);
      }
      timeoutId = setTimeout(
        () => rejectAndClose(new Error('Local UI timeout — close the tab and try again, or resubmit within the time limit.')),
        timeoutMs,
      );
    });
  });
}
