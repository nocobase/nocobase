/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type RunJSRoot = {
  unmount?: () => void;
};

type RunJSRootEntry = RunJSRoot & {
  root?: RunJSRoot;
  disposeTheme?: () => void;
};

type RunJSGlobal = typeof globalThis & {
  __nbRunjsRoots?: WeakMap<object, RunJSRootEntry>;
};

export function resetRunJSRuntimeElement(element: HTMLElement): void {
  const rootMap = (globalThis as RunJSGlobal).__nbRunjsRoots;
  const entry = rootMap?.get(element);
  if (entry) {
    rootMap?.delete(element);
    try {
      entry.disposeTheme?.();
    } catch {
      // Ignore cleanup failures so the root and DOM can still be cleared.
    }
    try {
      (entry.root || entry).unmount?.();
    } catch {
      // Ignore cleanup failures so the DOM can still be cleared.
    }
  }
  element.innerHTML = '';
}
