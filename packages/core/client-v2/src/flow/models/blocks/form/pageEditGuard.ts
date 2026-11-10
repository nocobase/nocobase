/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Router } from '@remix-run/router';

type FormGuard = {
  dirty: () => boolean;
  confirm: () => Promise<boolean>;
  discard: () => void;
};

const registrations = new WeakMap<Router, Set<FormGuard>>();
const key = 'nocobase-page-edit-form';

// React Router supports one active blocker. Group the forms on this page in one decision.
export function registerPageEditGuard(router: Router, guard: FormGuard) {
  let guards = registrations.get(router);
  if (!guards) {
    guards = new Set();
    registrations.set(router, guards);
  }
  guards.add(guard);
  if (guards.size === 1) {
    const dirtyForms = () => Array.from(guards).filter((form) => form.dirty());
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyForms().length) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    router.getBlocker(key, ({ currentLocation, nextLocation }) => {
      const pagePath = (path: string) => path.split('/view/')[0];
      return pagePath(currentLocation.pathname) !== pagePath(nextLocation.pathname) && dirtyForms().length > 0;
    });
    let confirming = false;
    const unsubscribe = router.subscribe(async (state) => {
      if (state.blockers.get(key)?.state !== 'blocked' || confirming) return;
      confirming = true;
      const dirty = dirtyForms();
      try {
        const confirmed = !dirty.length || (await dirty[0].confirm());
        const blocker = router.state.blockers.get(key);
        if (blocker?.state !== 'blocked') return;
        if (confirmed) {
          dirty.forEach((form) => form.discard());
          blocker.proceed();
        } else {
          blocker.reset();
        }
      } catch {
        const blocker = router.state.blockers.get(key);
        if (blocker?.state === 'blocked') blocker.reset();
      } finally {
        confirming = false;
      }
    });
    disposers.set(router, () => {
      unsubscribe();
      router.deleteBlocker(key);
      window.removeEventListener('beforeunload', beforeUnload);
    });
  }
  return () => {
    guards.delete(guard);
    if (guards.size === 0) {
      registrations.delete(router);
      disposers.get(router)?.();
      disposers.delete(router);
    }
  };
}

const disposers = new WeakMap<Router, () => void>();
