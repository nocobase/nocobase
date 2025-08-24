/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Sets or updates the tab UID in a pathname
 *
 * @param pathname - The current pathname
 * @param tabUid - The tab UID to set
 * @returns The updated pathname with the tab UID
 *
 * @example
 * ```typescript
 * // Add tab to basic path
 * setTabUidToPathname('/admin/page1', 'tab123')
 * // Returns: '/admin/page1/tab/tab123'
 *
 * // Update existing tab
 * setTabUidToPathname('/admin/page1/tab/oldTab', 'newTab')
 * // Returns: '/admin/page1/tab/newTab'
 * ```
 */
export function setTabUidToPathname(pathname: string, tabUid: string): string {
  if (!pathname || !tabUid) {
    return pathname;
  }

  // Split pathname into parts to handle query parameters and hash
  const queryIndex = pathname.indexOf('?');
  const hashIndex = pathname.indexOf('#');

  let basePath = pathname;
  let queryPart = '';
  let hashPart = '';

  // Extract query parameters and hash
  if (queryIndex !== -1) {
    basePath = pathname.substring(0, queryIndex);
    const remainingPart = pathname.substring(queryIndex);
    const hashInQuery = remainingPart.indexOf('#');

    if (hashInQuery !== -1) {
      queryPart = remainingPart.substring(0, hashInQuery);
      hashPart = remainingPart.substring(hashInQuery);
    } else {
      queryPart = remainingPart;
    }
  } else if (hashIndex !== -1) {
    basePath = pathname.substring(0, hashIndex);
    hashPart = pathname.substring(hashIndex);
  }

  // Check if basePath already contains /tab/
  const tabPattern = /\/tab\/[^/]+$/;

  if (tabPattern.test(basePath)) {
    // Replace existing tab UID
    basePath = basePath.replace(tabPattern, `/tab/${tabUid}`);
  } else {
    // Add new tab UID
    // Remove trailing slash if exists
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    basePath = `${cleanBasePath}/tab/${tabUid}`;
  }

  // Reconstruct the full pathname
  return basePath + queryPart + hashPart;
}
