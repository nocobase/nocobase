/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function forEachLinkageRule(linkageRules: any[], callback: (action: any, rule: any) => void) {
  linkageRules.forEach((rule) => {
    rule.actions?.forEach((action) => {
      callback(action, rule);
    });
  });
}
