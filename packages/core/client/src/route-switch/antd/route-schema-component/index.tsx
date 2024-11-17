/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { RemoteSchemaComponent, useCurrentPageUid } from '../../../';

export function RouteSchemaComponent() {
  const currentPageUid = useCurrentPageUid();
  return <RemoteSchemaComponent onlyRenderProperties uid={currentPageUid} />;
}

export const PageActiveContext = createContext(false);

/**
 * 获取当前页面是否可见
 * @returns
 */
export const usePageActive = () => {
  const active = useContext(PageActiveContext);
  return { active };
};
