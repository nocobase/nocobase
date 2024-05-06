/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * parseHTML('<span>{{version}}</span>', { version: '1.0.0' }) -> '<span>1.0.0</span>'
 * @param html
 * @param variables
 * @returns
 */
export function parseHTML(html: string, variables: Record<string, any>) {
  return html.replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return typeof variables[key] !== 'undefined' ? variables[key] : match;
  });
}
