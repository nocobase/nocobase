/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mobileAddBlockInitializer } from './initializer';

export function getPageContentSchema(firstTabSchemaUid: string) {
  return {
    type: 'void',
    'x-component': 'MobileContent',
    properties: {
      [firstTabSchemaUid]: getPageContentTabSchema(firstTabSchemaUid),
    },
  };
}

export function getPageContentTabSchema(pageSchemaUid: string) {
  return {
    type: 'void',
    'x-uid': pageSchemaUid,
    'x-async': true,
    'x-component': 'Grid',
    'x-initializer': mobileAddBlockInitializer.name,
  };
}
