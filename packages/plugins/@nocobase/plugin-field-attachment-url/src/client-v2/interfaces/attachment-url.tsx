/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import { FileCollectionSelect } from '../FileCollectionSelect';

export class AttachmentURLFieldInterface extends CollectionFieldInterface {
  name = 'attachmentURL';
  type = 'object';
  group = 'media';
  supportDataSourceType = ['main'];
  title = '{{t("Attachment (URL)")}}';
  default = {
    interface: 'attachmentURL',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  };
  availableTypes = ['string', 'text'];
  validationType = 'string';
  availableValidationOptions = ['min', 'max', 'length', 'pattern'];
  configure = {
    items: [
      {
        name: 'target',
        title: '{{t("Which file collection should it be uploaded to")}}',
        Component: FileCollectionSelect,
        required: true,
      },
      {
        name: 'targetKey',
        defaultValue: 'id',
        hidden: true,
      },
    ],
  };
  filterable = {
    operators: 'bigField',
    nested: true,
  };
  titleUsable = true;
}
