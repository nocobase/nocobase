/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const POPUP_CONTAINER_SELECTORS = [
  '.ant-modal-content',
  '.ant-modal',
  '.ant-drawer-content',
  '.ant-drawer-content-wrapper',
];

export const resolveTooltipParent = (element: HTMLElement | null) => {
  const doc = element?.ownerDocument ?? document;

  for (const selector of POPUP_CONTAINER_SELECTORS) {
    const popupContainer = element?.closest(selector);
    if (popupContainer instanceof HTMLElement) {
      return popupContainer;
    }
  }

  return (doc.getElementById('nocobase-embed-container') as HTMLElement | null) || doc.body;
};
