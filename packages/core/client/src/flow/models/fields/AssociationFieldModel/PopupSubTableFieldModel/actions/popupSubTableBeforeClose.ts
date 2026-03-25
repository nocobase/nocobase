/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { createDirtyConfirmBeforeCloseHandler, resetDirtyFormModels } from '../../../../../utils/dirtyForms';

type PopupBeforeClosePayload = {
  result?: any;
  force?: boolean;
  ignoredDirtyFormModelUids?: string[];
};

type PopupViewLike = {
  beforeClose?: (payload: PopupBeforeClosePayload) => Promise<boolean | void> | boolean | void;
};

export function bindPopupSubTableBeforeClose({
  view,
  model,
  modal,
  t,
}: {
  view: PopupViewLike;
  model?: FlowModel | null;
  modal: {
    confirm: (options: {
      title: string;
      content: string;
      okText: string;
      cancelText: string;
    }) => Promise<boolean> | boolean;
  };
  t: (key: string) => string;
}) {
  const previousBeforeClose = view.beforeClose;
  const dirtyBeforeClose = createDirtyConfirmBeforeCloseHandler({ model, modal, t });

  const beforeClose = async (payload: PopupBeforeClosePayload) => {
    const dirty = await dirtyBeforeClose(payload);
    if (!dirty) {
      return false;
    }

    const ignoredDirtyFormModelUids = Array.from(
      new Set([...(payload.ignoredDirtyFormModelUids || []), ...dirty.formModelUids]),
    );
    const shouldClose =
      (await previousBeforeClose?.({
        ...payload,
        ignoredDirtyFormModelUids,
      })) !== false;

    if (!shouldClose) {
      return false;
    }

    if (dirty.hasDirtyForms) {
      resetDirtyFormModels(model, dirty.formModelUids);
    }

    return true;
  };

  view.beforeClose = beforeClose;

  return () => {
    if (view.beforeClose === beforeClose) {
      view.beforeClose = previousBeforeClose;
    }
  };
}
