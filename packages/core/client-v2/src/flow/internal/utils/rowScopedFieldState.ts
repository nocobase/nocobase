/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const ROW_SCOPED_FIELD_OPTIONS_PROP = '__rowScopedFieldOptions';
export const ROW_SCOPED_CLEAR_VALUE_ON_HIDDEN_PROP = '__rowScopedClearValueOnHidden';

const ROW_SCOPED_FIELD_STATE_PROP_KEYS = ['disabled', 'required', 'hidden', 'hiddenModel'] as const;

type ForkLike = {
  isFork?: boolean;
  localProps?: Record<string, unknown>;
  setProps?: (props: Record<string, unknown>) => void;
  __subTableRowScopedOptionsApplied?: boolean;
  __subTableRowScopedStatePropsApplied?: boolean;
};

function cloneOptionList(options: unknown[]) {
  return options.map((option) => (option && typeof option === 'object' ? { ...option } : option));
}

function clearForkLocalProp(model: ForkLike | undefined, prop: string) {
  if (!model?.isFork || !model?.localProps || !Object.prototype.hasOwnProperty.call(model.localProps, prop)) {
    return;
  }
  const next = { ...model.localProps };
  delete next[prop];
  model.localProps = next;
}

export function applyRowScopedFieldOptionsToFork(fieldFork: ForkLike | undefined, options: unknown) {
  if (!fieldFork?.isFork) return;

  if (Array.isArray(options)) {
    fieldFork.__subTableRowScopedOptionsApplied = true;
    fieldFork.setProps?.({ options: cloneOptionList(options) });
    return;
  }

  if (!fieldFork.__subTableRowScopedOptionsApplied) return;
  fieldFork.__subTableRowScopedOptionsApplied = false;
  clearForkLocalProp(fieldFork, 'options');
}

export function syncRowScopedFieldStatePropsToFork(
  fieldFork: ForkLike | undefined,
  fieldStateProps: Record<string, unknown>,
  disabled: boolean,
) {
  if (!fieldFork?.isFork) return;

  const nextProps: Record<string, unknown> = {};
  for (const key of ROW_SCOPED_FIELD_STATE_PROP_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(fieldStateProps, key)) continue;
    nextProps[key] = key === 'disabled' ? disabled : fieldStateProps[key];
  }

  if (Object.keys(nextProps).length) {
    fieldFork.__subTableRowScopedStatePropsApplied = true;
    fieldFork.setProps?.(nextProps);
    return;
  }

  if (!fieldFork.__subTableRowScopedStatePropsApplied) return;
  fieldFork.__subTableRowScopedStatePropsApplied = false;
  for (const key of ROW_SCOPED_FIELD_STATE_PROP_KEYS) {
    clearForkLocalProp(fieldFork, key);
  }
}
