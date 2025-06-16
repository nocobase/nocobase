/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const openDrawer = () => {};

const openModal = () => {};

const openSubPage = () => {};

export const openView = (params: { type: 'drawer' | 'modal' | 'subPage' }) => {
  const { type } = params;
  switch (type) {
    case 'drawer':
      return openDrawer();
    case 'modal':
      return openModal();
    case 'subPage':
      return openSubPage();
    default:
      throw new Error(`Unsupported view type: ${type}`);
  }
};
