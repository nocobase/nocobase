/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getMobilePageContentSchema } from './content';
import { mobilePageNavigationBarSchema } from './navigation-bar';
import { mobilePageSettings } from './settings';

export function getMobilePageSchema(pageSchemaUid: string, firstTabUid: string) {
  const pageSchema = {
    type: 'void',
    name: pageSchemaUid,
    'x-uid': pageSchemaUid,
    'x-component': 'MobilePageProvider',
    'x-settings': mobilePageSettings.name,
    'x-decorator': 'BlockItem',
    'x-toolbar-props': {
      draggable: false,
    },
    properties: {
      navigationBar: mobilePageNavigationBarSchema,
      content: getMobilePageContentSchema(firstTabUid),
    },
  };

  return { schema: pageSchema };
}
