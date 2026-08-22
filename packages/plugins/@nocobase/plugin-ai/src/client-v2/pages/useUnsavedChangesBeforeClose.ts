/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import type { FormInstance } from 'antd';
import isEqual from 'lodash/isEqual';

type ClosePayload = {
  force?: boolean;
  result?: unknown;
};

type BeforeCloseHandler = (payload?: ClosePayload) => boolean | void | Promise<boolean | void>;

type ViewWithBeforeClose = {
  beforeClose?: BeforeCloseHandler;
  close: (result?: unknown, force?: boolean) => boolean | void | Promise<boolean | void>;
};

type UseUnsavedChangesBeforeCloseOptions<Values extends object> = {
  view: ViewWithBeforeClose;
  form: FormInstance<Values>;
  initialValues: Values;
  dirty: boolean;
  title: React.ReactNode;
  content: React.ReactNode;
};

export function useUnsavedChangesBeforeClose<Values extends object>({
  view,
  form,
  initialValues,
  dirty,
  title,
  content,
}: UseUnsavedChangesBeforeCloseOptions<Values>) {
  const confirmedRef = useRef(false);

  const hasUnsavedChanges = useCallback(() => {
    const currentValues = form.getFieldsValue(true);
    return dirty || !isEqual(currentValues, initialValues);
  }, [dirty, form, initialValues]);

  useEffect(() => {
    const previousBeforeClose = view.beforeClose;
    const beforeClose: BeforeCloseHandler = async (payload) => {
      if (payload?.force || confirmedRef.current || !hasUnsavedChanges()) {
        const allowed = await previousBeforeClose?.(payload);
        return allowed !== false;
      }

      return new Promise<boolean>((resolve) => {
        const confirmInstance = Modal.confirm({
          title,
          content,
          onOk: () => {
            confirmInstance.destroy();
            confirmedRef.current = true;
            Promise.resolve(previousBeforeClose?.(payload))
              .then((allowed) => resolve(allowed !== false))
              .catch(() => resolve(false));
          },
          onCancel: () => {
            confirmInstance.destroy();
            resolve(false);
          },
        });
      });
    };

    view.beforeClose = beforeClose;

    return () => {
      if (view.beforeClose === beforeClose) {
        view.beforeClose = previousBeforeClose;
      }
    };
  }, [content, hasUnsavedChanges, title, view]);

  return useCallback(() => view.close(), [view]);
}
