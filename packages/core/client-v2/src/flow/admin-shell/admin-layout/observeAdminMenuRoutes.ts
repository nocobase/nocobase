/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type MenuNode<T> = {
  _route?: { type?: string };
  _model?: { readonly pendingMenuState?: Promise<void> };
  _landingPage?: unknown;
  routes?: T[];
};

// Only the candidate page and its ancestor groups can change this group's first destination.
function pendingLanding<T extends MenuNode<T>>(group: T) {
  let candidate: T | undefined = group;
  while (candidate) {
    const pending = candidate._model?.pendingMenuState;
    if (pending) return pending;
    candidate = candidate.routes?.find((child) => child._landingPage);
  }
}

export function observeAdminMenuRoutes<T extends MenuNode<T>>(
  project: () => { path: string; children: T[] },
  publish: (route: { path: string; children: T[] }) => void,
  designable: boolean,
) {
  let active = true;
  const waiting = new Set<Promise<void>>();

  const showReadyGroup = (node: T) => {
    if (node._route?.type !== 'group') return true;
    const pending = pendingLanding(node);
    if (pending) {
      if (!waiting.has(pending)) {
        waiting.add(pending);
        void pending.then(update, update);
      }
      return false;
    }
    if (node.routes) node.routes = node.routes.filter(showReadyGroup);
    return true;
  };

  function update() {
    if (!active) return;
    const route = project();
    if (!designable) route.children = route.children.filter(showReadyGroup);
    publish(route);
  }

  update();
  return () => {
    active = false;
  };
}
