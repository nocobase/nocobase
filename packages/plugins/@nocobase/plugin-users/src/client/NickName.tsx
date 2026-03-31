/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaSettingsItem, useToken, useCurrentUserContext } from '@nocobase/client';

export const NickName = () => {
  const { data } = useCurrentUserContext();
  const { token } = useToken();
  return (
    <SchemaSettingsItem disabled={true} eventKey="nickname" title="nickname">
      <span aria-disabled="false" style={{ cursor: 'text', color: token.colorTextDescription }}>
        {data?.data?.nickname || data?.data?.username || data?.data?.email}
      </span>
    </SchemaSettingsItem>
  );
};
