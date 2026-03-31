/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, interfacesProperties } from '@nocobase/client';
import { ISchema } from '@formily/react';
import { useAttachmentTargetProps } from '../hook';
import { tStr } from '../locale';

const { defaultProps, operators } = interfacesProperties;

export const defaultToolbar = [
  'headings',
  'bold',
  'italic',
  'strike',
  'link',
  'list',
  'ordered-list',
  'check',
  'quote',
  'line',
  'code',
  'inline-code',
  'upload',
  'fullscreen',
];

export class AttachmentURLFieldInterface extends CollectionFieldInterface {
  name = 'attachmentURL';
  type = 'object';
  group = 'media';
  title = tStr('Attachment (URL)');
  default = {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'AttachmentUrl',
      'x-use-component-props': 'useAttachmentUrlFieldProps',
    },
  };
  availableTypes = ['string', 'text'];
  properties = {
    ...defaultProps,
    target: {
      required: true,
      type: 'string',
      title: tStr('Which file collection should it be uploaded to'),
      'x-decorator': 'FormItem',
      'x-component': 'RemoteSelect',
      'x-use-component-props': useAttachmentTargetProps,
      'x-reactions': (field) => {
        const options = field.data?.options || [];
        const hasAttachments = options.some((opt) => opt?.name === 'attachments');
        if (hasAttachments) {
          !field.initialValue && field.setInitialValue('attachments');
        }
      },
    },
    targetKey: {
      'x-hidden': true,
      default: 'id',
      type: 'string',
    },
  };
  schemaInitialize(schema: ISchema, { block }) {
    schema['x-component-props'] = schema['x-component-props'] || {};
    schema['x-component-props']['mode'] = 'AttachmentUrl';
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props']['ellipsis'] = true;
      schema['x-component-props']['size'] = 'small';
    }
  }
  filterable = {
    nested: true,
    operators: operators.bigField,
  };
  titleUsable = true;
}
