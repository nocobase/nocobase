/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { createDirtyConfirmBeforeCloseHandler } from '../../../../../utils/dirtyForms';

type PopupViewLike = {
  beforeClose?: (payload: { result?: any; force?: boolean }) => Promise<boolean | void> | boolean | void;
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

  const beforeClose = async (payload: { result?: any; force?: boolean }) => {
    const shouldClose = await dirtyBeforeClose(payload);
    if (!shouldClose) {
      return false;
    }

    return (await previousBeforeClose?.(payload)) !== false;
  };

  view.beforeClose = beforeClose;

  return () => {
    if (view.beforeClose === beforeClose) {
      view.beforeClose = previousBeforeClose;
    }
  };
}
