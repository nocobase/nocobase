/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../../__builtins__/style';

export const useStyles = genStyleHook('nb-menu-item', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      paddingLeft: `${token.padding}px !important`,
      paddingRight: `${token.padding}px !important`,
    },
  };
});
