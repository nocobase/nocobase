/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../../../schema-component/antd/__builtins__/style';

export const useStyles = genStyleHook('nb-array-collapse', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      marginBottom: '10px',
    },
  };
});
