/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import type { HookAPI } from 'antd/es/modal/useModal';

type PopupBeforeClosePayload = {
  result?: any;
  force?: boolean;
  ignoredDirtyFormModelUids?: string[];
};

type PopupViewLike = {
  beforeClose?: (payload: PopupBeforeClosePayload) => Promise<boolean | void> | boolean | void;
};

type DirtyAwareFlowModel = FlowModel & {
  getUserModifiedFields?: () => Set<string> | undefined;
  resetUserModifiedFields?: () => void;
};

const POPUP_BEFORE_CLOSE_NEXT = Symbol('popupBeforeCloseNext');

type PopupBeforeCloseHandler = NonNullable<PopupViewLike['beforeClose']> & {
  [POPUP_BEFORE_CLOSE_NEXT]?: PopupViewLike['beforeClose'];
};

function visitModelTree(model: FlowModel | null | undefined, visitor: (current: DirtyAwareFlowModel) => void) {
  const stack = model ? [model as DirtyAwareFlowModel] : [];
  const visited = new Set<string>();

  while (stack.length) {
    const current = stack.pop();
    if (!current?.uid || visited.has(current.uid)) {
      continue;
    }

    visited.add(current.uid);
    visitor(current);

    Object.values(current.subModels || {}).forEach((subModelValue) => {
      if (Array.isArray(subModelValue)) {
        stack.push(...(subModelValue as DirtyAwareFlowModel[]));
      } else if (subModelValue && typeof subModelValue === 'object') {
        stack.push(subModelValue as DirtyAwareFlowModel);
      }
    });
  }
}

function unlinkBeforeClose(view: PopupViewLike, target: PopupBeforeCloseHandler) {
  let previous: PopupBeforeCloseHandler | undefined;
  let current = view.beforeClose as PopupBeforeCloseHandler | undefined;

  while (current) {
    if (current === target) {
      if (previous) {
        previous[POPUP_BEFORE_CLOSE_NEXT] = current[POPUP_BEFORE_CLOSE_NEXT];
      } else {
        view.beforeClose = current[POPUP_BEFORE_CLOSE_NEXT];
      }
      break;
    }
    if (!(POPUP_BEFORE_CLOSE_NEXT in current)) {
      break;
    }
    previous = current;
    current = current[POPUP_BEFORE_CLOSE_NEXT] as PopupBeforeCloseHandler | undefined;
  }
}

export function bindPopupSubTableBeforeClose({
  view,
  model,
  modal,
  t,
}: {
  view: PopupViewLike;
  model?: FlowModel | null;
  modal: Pick<HookAPI, 'confirm'>;
  t: (key: string) => string;
}) {
  const collectDirtyFormModelUids = (ignoredDirtyFormModelUids: string[] = []) => {
    const dirtyFormModelUids: string[] = [];
    const ignoredUidSet = ignoredDirtyFormModelUids.length ? new Set(ignoredDirtyFormModelUids) : null;

    visitModelTree(model, (current) => {
      if (current.uid && current.getUserModifiedFields?.()?.size && !ignoredUidSet?.has(current.uid)) {
        dirtyFormModelUids.push(current.uid);
      }
    });

    return dirtyFormModelUids;
  };

  const resetDirtyFormModels = (dirtyFormModelUids: string[]) => {
    if (!dirtyFormModelUids.length) {
      return;
    }

    const targetUids = new Set(dirtyFormModelUids);
    visitModelTree(model, (current) => {
      if (current.uid && targetUids.has(current.uid)) {
        current.resetUserModifiedFields?.();
      }
    });
  };

  const beforeClose = (async (payload: PopupBeforeClosePayload) => {
    const dirtyFormModelUids = payload.force ? [] : collectDirtyFormModelUids(payload.ignoredDirtyFormModelUids);

    if (dirtyFormModelUids.length) {
      const confirmed = await modal.confirm({
        title: t('Unsaved changes'),
        content: t("Are you sure you don't want to save?"),
        okText: t('Confirm'),
        cancelText: t('Cancel'),
      });

      if (!confirmed) {
        return false;
      }
    }

    const nextBeforeClose = beforeClose[POPUP_BEFORE_CLOSE_NEXT];
    const ignoredDirtyFormModelUids = dirtyFormModelUids.length
      ? Array.from(new Set([...(payload.ignoredDirtyFormModelUids || []), ...dirtyFormModelUids]))
      : payload.ignoredDirtyFormModelUids;
    const shouldClose =
      (await nextBeforeClose?.({
        ...payload,
        ignoredDirtyFormModelUids,
      })) !== false;

    if (!shouldClose) {
      return false;
    }

    if (dirtyFormModelUids.length) {
      resetDirtyFormModels(dirtyFormModelUids);
    }

    return true;
  }) as PopupBeforeCloseHandler;

  beforeClose[POPUP_BEFORE_CLOSE_NEXT] = view.beforeClose;
  view.beforeClose = beforeClose;

  return () => {
    unlinkBeforeClose(view, beforeClose);
  };
}
