/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const ROW_SELECTOR = 'tr[data-param-name][data-param-in]';
const INPUT_SELECTOR = 'input, textarea';

type InputLike = HTMLInputElement | HTMLTextAreaElement;

function getParameterInputKey(input: InputLike): string | null {
  const row = input.closest(ROW_SELECTOR);
  const opblock = input.closest('.opblock');
  const paramName = row?.getAttribute('data-param-name');
  const paramIn = row?.getAttribute('data-param-in');
  const operationId = opblock?.id;

  if (!row || !paramName || !paramIn || !operationId) {
    return null;
  }

  return `${operationId}::${paramIn}::${paramName}`;
}

function getParameterInputs(root: ParentNode): InputLike[] {
  return Array.from(root.querySelectorAll<InputLike>(`${ROW_SELECTOR} ${INPUT_SELECTOR}`));
}

export function syncSwaggerParameterValues(root: ParentNode, values: Map<string, string>) {
  for (const input of getParameterInputs(root)) {
    const key = getParameterInputKey(input);
    if (!key) continue;

    if (!values.has(key)) {
      values.set(key, input.value);
      continue;
    }

    const expectedValue = values.get(key) ?? '';
    if (input.value !== expectedValue) {
      input.value = expectedValue;
    }
  }
}

export function createSwaggerParameterValuePersistence(root: HTMLElement) {
  const values = new Map<string, string>();

  const handleInput = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const key = getParameterInputKey(target);
    if (!key) return;

    values.set(key, target.value);
  };

  const observer = new MutationObserver(() => {
    syncSwaggerParameterValues(root, values);
  });

  root.addEventListener('input', handleInput, true);
  root.addEventListener('change', handleInput, true);
  syncSwaggerParameterValues(root, values);
  observer.observe(root, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    root.removeEventListener('input', handleInput, true);
    root.removeEventListener('change', handleInput, true);
  };
}
