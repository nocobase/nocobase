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
  result: any;
  error?: string;
  setResult: (result: any) => void;
  setError?: (error: string) => void;
}

export const configStore = model<ConfigState>({
  result: null,
  error: '',
  setResult(result: any) {
    this.error = null;
    this.result = result;
  },
  setError(error: string) {
    this.result = null;
    this.error = error;
  },
});
