/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';

type DirtyAwareFlowModel = FlowModel & {
  getUserModifiedFields?: () => Set<string> | undefined;
  resetUserModifiedFields?: () => void;
};

export type BeforeCloseDirtyState = {
  hasDirtyForms: boolean;
  formModelUids: string[];
};

type BeforeClosePayload = {
  result?: any;
  force?: boolean;
};

type ConfirmModal = {
  confirm: (options: {
    title: string;
    content: string;
    okText: string;
    cancelText: string;
  }) => Promise<boolean> | boolean;
};

function walkFlowModels(model: FlowModel | null | undefined, visitor: (current: DirtyAwareFlowModel) => void) {
  if (!model) {
    return;
  }

  const visited = new WeakSet<object>();

  const walk = (current?: DirtyAwareFlowModel | null) => {
    if (!current || typeof current !== 'object' || visited.has(current)) {
      return;
    }

    visited.add(current);
    visitor(current);

    Object.values(current.subModels || {}).forEach((subModelValue) => {
      _.castArray(subModelValue).forEach((subModel) => {
        if (subModel && typeof subModel === 'object') {
          walk(subModel as DirtyAwareFlowModel);
        }
      });
    });
  };

  walk(model as DirtyAwareFlowModel);
}

export function collectDirtyFormModelUids(model?: FlowModel | null): string[] {
  const dirtyModelUids: string[] = [];

  walkFlowModels(model, (current) => {
    const userModifiedFields = current.getUserModifiedFields?.();
    if (current.uid && userModifiedFields?.size) {
      dirtyModelUids.push(current.uid);
    }
  });

  return dirtyModelUids;
}

export function createBeforeCloseDirtyState(model?: FlowModel | null): BeforeCloseDirtyState {
  const formModelUids = collectDirtyFormModelUids(model);
  return {
    hasDirtyForms: formModelUids.length > 0,
    formModelUids,
  };
}

export function resetDirtyFormModels(model?: FlowModel | null, formModelUids?: string[]) {
  const uidSet = formModelUids?.length ? new Set(formModelUids) : null;

  walkFlowModels(model, (current) => {
    if (uidSet && (!current.uid || !uidSet.has(current.uid))) {
      return;
    }
    current.resetUserModifiedFields?.();
  });
}

export function createDirtyConfirmBeforeCloseHandler({
  model,
  modal,
  t,
}: {
  model?: FlowModel | null;
  modal: ConfirmModal;
  t: (key: string) => string;
}) {
  return async ({ force }: BeforeClosePayload) => {
    if (force) {
      return true;
    }

    const dirty = createBeforeCloseDirtyState(model);
    if (!dirty.hasDirtyForms) {
      return true;
    }

    const confirmed = await modal.confirm({
      title: t('Unsaved changes'),
      content: t("Are you sure you don't want to save?"),
      okText: t('Confirm'),
      cancelText: t('Cancel'),
    });

    if (!confirmed) {
      return false;
    }

    resetDirtyFormModels(model, dirty.formModelUids);
    return true;
  };
}
