/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/client';
import { InAppMessagesDefinition, ChatsDefinition } from '../../types';

const collection: CollectionOptions = {
  name: InAppMessagesDefinition.name,
  title: 'in-app messages',
  fields: [
    {
      name: InAppMessagesDefinition.fieldNameMap.id,
      type: 'uuid',
      primaryKey: true,
      allowNull: false,
      interface: 'uuid',
      uiSchema: {
        type: 'string',
        title: '{{t("ID")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      name: 'sender',
      type: 'belongsTo',
      target: ChatsDefinition.name,
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Title")}}',
        required: true,
      },
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.content,
      type: 'json',
      interface: 'json',
    },
    {
      name: InAppMessagesDefinition.fieldNameMap.status,
      type: 'string',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Status")}}',
        required: true,
      },
    },
  ],
};

export default collection;
