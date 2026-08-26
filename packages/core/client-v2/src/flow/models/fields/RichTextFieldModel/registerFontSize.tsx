/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const registerFontSize = (Quill) => {
  const SizeStyle = Quill.import('attributors/style/size');
  SizeStyle.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'];
  Quill.register(SizeStyle, true);

  // Set the default font size to 14px
  const Parchment = Quill.import('parchment');
  SizeStyle.add(Parchment.Scope.BLOCK, '14px');
};
