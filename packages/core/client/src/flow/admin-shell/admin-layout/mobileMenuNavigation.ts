/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const MOBILE_MENU_CLOSE_DELAY_MS = 220;

export const runAfterMobileMenuClosed = ({
  isMobile,
  closeMobileMenu,
  callback,
  delayMs = MOBILE_MENU_CLOSE_DELAY_MS,
}: {
  isMobile: boolean;
  closeMobileMenu: () => void;
  callback: () => void;
  delayMs?: number;
}) => {
  if (!isMobile) {
    callback();
    return;
  }

  closeMobileMenu();
  window.setTimeout(callback, delayMs);
};
