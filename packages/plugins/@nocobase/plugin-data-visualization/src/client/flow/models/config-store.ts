/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { model } from '@formily/reactive';

interface ConfigState {
  results: {
    [uid: string]: {
      result: any;
      error?: string;
    };
  };
  setResult: (uid: string, result: any) => void;
  setError?: (uid: string, error: string) => void;
}

export const configStore = model<ConfigState>({
  results: {},
  setResult(uid: string, result: any) {
    this.results[uid] = {
      result,
      error: null,
    };
  },
  setError(uid: string, error: string) {
    this.results[uid] = {
      result: null,
      error,
    };
  },
});
