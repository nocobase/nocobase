/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Divider, theme } from 'antd';
import React from 'react';

export const SchemaInitializerDivider = () => {
  const { token } = theme.useToken();
  return <Divider style={{ marginTop: token.marginXXS, marginBottom: token.marginXXS }} />;
};
