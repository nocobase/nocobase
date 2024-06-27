/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { RemoteSchemaComponent } from '@nocobase/client';
import { useMobileTabContext } from '../mobile-providers';

export const MobileContent = () => {
  const { tabSchemaUid } = useParams();
  const { activeTabBarItem } = useMobileTabContext();
  // 如果 URL 中有 tabSchemaUid，则使用 tabSchemaUid，否则使用第一个 tab 的 pageSchemaUid
  return (
    <RemoteSchemaComponent
      uid={tabSchemaUid || activeTabBarItem.children?.[0]?.options?.tabSchemaUid}
      memoized={false}
      NotFoundPage={'MobileNotFoundPage'}
    />
  );
};
