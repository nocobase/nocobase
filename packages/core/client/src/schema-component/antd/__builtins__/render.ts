/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReactElement } from 'react';
import * as ReactDOM from 'react-dom';
import type { Root } from 'react-dom/client';

// 移植自rc-util: https://github.com/react-component/util/blob/master/src/React/render.ts

type CreateRoot = (container: ContainerType) => Root;

// Let compiler not to search module usage
const fullClone = {
  ...ReactDOM,
} as typeof ReactDOM & {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
    usingClientEntryPoint?: boolean;
  };
  createRoot?: CreateRoot;
};

const { version, render: reactRender, unmountComponentAtNode } = fullClone;

let createRoot: CreateRoot;
try {
  const mainVersion = Number((version || '').split('.')[0]);
  if (mainVersion >= 18 && fullClone.createRoot) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    createRoot = fullClone.createRoot;
  }
} catch (e) {
  // Do nothing;
}

function toggleWarning(skip: boolean) {
  const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = fullClone;

  if (
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
    typeof __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === 'object'
  ) {
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.usingClientEntryPoint = skip;
  }
}

const MARK = '__antd_mobile_root__';

// ========================== Render ==========================
type ContainerType = (Element | DocumentFragment) & {
  [MARK]?: Root;
};

function legacyRender(node: ReactElement, container: ContainerType) {
  reactRender(node, container);
}

function concurrentRender(node: ReactElement, container: ContainerType) {
  toggleWarning(true);
  const root = container[MARK] || createRoot(container);
  toggleWarning(false);
  root.render(node);
  container[MARK] = root;
}

export function render(node: ReactElement, container: ContainerType) {
  if (createRoot as unknown) {
    concurrentRender(node, container);
    return;
  }
  legacyRender(node, container);
}

// ========================== Unmount =========================
function legacyUnmount(container: ContainerType) {
  return unmountComponentAtNode(container);
}

async function concurrentUnmount(container: ContainerType) {
  // Delay to unmount to avoid React 18 sync warning
  return Promise.resolve().then(() => {
    container[MARK]?.unmount();
    delete container[MARK];
  });
}

export function unmount(container: ContainerType) {
  if (createRoot as unknown) {
    return concurrentUnmount(container);
  }

  return legacyUnmount(container);
}
