/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatsDefinition, InAppMessagesDefinition } from '../../types';
import { CollectionOptions } from '@nocobase/client';

const collection: CollectionOptions = {
  name: ChatsDefinition.name,
  title: 'in-app messages',
  fields: [
    {
      name: ChatsDefinition.fieldNameMap.id,
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
      name: ChatsDefinition.fieldNameMap.title,
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Title")}}',
        required: true,
      },
    },
    {
      name: 'lastMsg',
      target: InAppMessagesDefinition.name,
      targetKey: InAppMessagesDefinition.fieldNameMap.id,
      foreignKey: ChatsDefinition.fieldNameMap.lastMsgId,
      interface: 'm2o',
      type: 'belongsTo',
      onDelete: 'SET NULL',
      uiSchema: {
        type: 'string',
        title: '{{t("Message")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: false,
        },
      },
    },
  ],
};

export default collection;
