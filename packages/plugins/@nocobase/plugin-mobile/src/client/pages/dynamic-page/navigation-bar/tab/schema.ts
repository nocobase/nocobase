/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface GetMobileNavigationBarTabDataOptions {
  tabSchemaUid: string;
  pageUrl?: string;
  parentId: number;
  title?: string;
}

export function getMobilePageNavigationBarTabData(options: GetMobileNavigationBarTabDataOptions) {
  const { tabSchemaUid, pageUrl, parentId, title } = options;
  return {
    url: `${pageUrl}/tabs/${tabSchemaUid}`,
    parentId,
    options: {
      title: title || 'Unnamed',
      tabSchemaUid,
    },
  };
}
