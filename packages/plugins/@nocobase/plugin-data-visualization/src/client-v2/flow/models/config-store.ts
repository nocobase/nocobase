/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface ConfigState {
  results: {
    [uid: string]: {
      result: any;
      error?: string;
    };
  };
  setResult: (uid: string, result: any) => void;
  setError: (uid: string, error: string) => void;
}

type ConfigStore = ConfigState & {
  version: number;
  subscribe: (listener: () => void) => () => void;
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const store: ConfigStore = {
  results: {},
  version: 0,
  setResult(uid: string, result: any) {
    this.results[uid] = {
      result,
      error: null,
    };
    this.version += 1;
    notify();
  },
  setError(uid: string, error: string) {
    this.results[uid] = {
      result: null,
      error,
    };
    this.version += 1;
    notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const configStore = store;
