/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';

const calcCustomToken = (name: string, value: any) => {
  if (name === 'colorSettings') {
    const color = new TinyColor(value);
    return {
      colorSettings: value,
      colorBgSettingsHover: color.setAlpha(0.06).toHex8String(),
      colorTemplateBgSettingsHover: color.complement().setAlpha(0.06).toHex8String(),
      colorBorderSettingsHover: color.setAlpha(0.3).toHex8String(),
    };
  }

  return {
    [name]: value,
  };
};

export default calcCustomToken;
