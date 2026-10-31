/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type QuickEditViewContainerLike = {
  update?: (newConfig: { preventClose?: boolean }) => unknown;
};

type QuickEditFieldModelLike = {
  parent?: {
    use?: string;
    viewContainer?: QuickEditViewContainerLike;
  } | null;
};

export function getQuickEditViewContainer(model: QuickEditFieldModelLike | undefined) {
  const parent = model?.parent;
  if (parent?.use !== 'QuickEditFormModel') {
    return undefined;
  }
  return parent.viewContainer;
}

/**
 * Keeps the quick edit popover open while a nested dropdown (Select / Cascader) is open. The outside click that
 * closes the dropdown would otherwise also close the popover and drop the unsaved edit. Releasing is deferred so the
 * closing click itself never reaches the popover as a close request.
 */
export function syncQuickEditPreventClose(model: QuickEditFieldModelLike | undefined, dropdownOpen: boolean) {
  const container = getQuickEditViewContainer(model);
  if (!container?.update) {
    return;
  }
  if (dropdownOpen) {
    container.update({ preventClose: true });
    return;
  }
  setTimeout(() => {
    container.update?.({ preventClose: false });
  }, 0);
}
