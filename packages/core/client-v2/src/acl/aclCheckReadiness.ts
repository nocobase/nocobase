/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';

type ReadinessListener = (ready: boolean) => void;

const readinessByApp = new WeakMap<object, boolean>();
const listenersByApp = new WeakMap<object, Set<ReadinessListener>>();

export function getACLCheckReady(app: object) {
  return readinessByApp.get(app) ?? false;
}

export function setACLCheckReady(app: object, ready: boolean) {
  readinessByApp.set(app, ready);
  listenersByApp.get(app)?.forEach((listener) => listener(ready));
}

export function useACLCheckReady(app: object) {
  const [ready, setReady] = useState(() => getACLCheckReady(app));

  useEffect(() => {
    const listeners = listenersByApp.get(app) || new Set<ReadinessListener>();
    listeners.add(setReady);
    listenersByApp.set(app, listeners);
    setReady(getACLCheckReady(app));

    return () => {
      listeners.delete(setReady);
      if (!listeners.size) {
        listenersByApp.delete(app);
      }
    };
  }, [app]);

  return ready;
}
