/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getPageContentSchema } from '../mobile-content';
import { mobileNavigationBarSchema } from '../mobile-navigation-bar';

export function getMobilePageSchema(pageSchemaUId: string, firstTabSchemaUid: string) {
  const pageSchema = {
    type: 'void',
    name: pageSchemaUId,
    'x-uid': pageSchemaUId,
    'x-component': 'MobilePage',
    'x-settings': 'mobile:page',
    'x-decorator': 'BlockItem',
    'x-toolbar-props': {
      draggable: false,
    },
    properties: {
      navigationBar: mobileNavigationBarSchema,
      content: getPageContentSchema(firstTabSchemaUid),
    },
  };

  return { schema: pageSchema };
}
