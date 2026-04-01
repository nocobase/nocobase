/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FormInstance } from 'antd';
import type { Patch, SetOptions } from './types';

export type FormPatcher = {
  patch: (form: FormInstance) => void;
  restore: () => void;
};

export function createFormPatcher(options: {
  isSuppressed: () => boolean;
  getCallerContext: () => any;
  setFormValues: (callerCtx: any, patch: Patch, options?: SetOptions) => Promise<void>;
}): FormPatcher {
  let patchedForm: FormInstance | undefined;
  let originalFormSetFieldValue: ((namePath: any, value: any) => void) | undefined;
  let originalFormSetFieldsValue: ((values: any) => void) | undefined;

  const restore = () => {
    const form = patchedForm;
    if (!form) return;

    if (originalFormSetFieldValue) {
      (form as any).setFieldValue = originalFormSetFieldValue;
    }
    if (originalFormSetFieldsValue) {
      (form as any).setFieldsValue = originalFormSetFieldsValue;
    }

    patchedForm = undefined;
    originalFormSetFieldValue = undefined;
    originalFormSetFieldsValue = undefined;
  };

  const patch = (form: FormInstance) => {
    if (patchedForm === form) return;

    // 避免不同 form 实例之间残留补丁
    restore();

    const originalSetFieldValue =
      typeof (form as any)?.setFieldValue === 'function' ? (form as any).setFieldValue.bind(form) : undefined;
    const originalSetFieldsValue =
      typeof (form as any)?.setFieldsValue === 'function' ? (form as any).setFieldsValue.bind(form) : undefined;

    patchedForm = form;
    originalFormSetFieldValue = originalSetFieldValue;
    originalFormSetFieldsValue = originalSetFieldsValue;

    if (originalSetFieldValue) {
      (form as any).setFieldValue = (namePath: any, value: any) => {
        // runtime 内部写入会抑制回调：此处需走原始写入避免递归
        if (options.isSuppressed()) {
          originalSetFieldValue(namePath, value);
          return;
        }
        void options
          .setFormValues(options.getCallerContext(), [{ path: namePath, value }], { source: 'system' })
          .catch(() => undefined);
      };
    }

    if (originalSetFieldsValue) {
      (form as any).setFieldsValue = (values: any) => {
        if (options.isSuppressed()) {
          originalSetFieldsValue(values);
          return;
        }
        void options.setFormValues(options.getCallerContext(), values, { source: 'system' }).catch(() => undefined);
      };
    }
  };

  return { patch, restore };
}
