/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { useField } from '@formily/react';
import { CollectionFieldInterface } from '@nocobase/client-v2';

const attachmentUrlOperators = [
  {
    label: '{{t("contains")}}',
    value: '$includes',
    selected: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("does not contain")}}',
    value: '$notIncludes',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is")}}',
    value: '$eq',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is empty")}}',
    value: '$empty',
    noValue: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is not empty")}}',
    value: '$notEmpty',
    noValue: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
];

const useAttachmentTargetProps = () => {
  const field = useField();
  return {
    service: {
      resource: 'collections:listFileCollectionsWithPublicStorage',
      params: {
        paginate: false,
      },
    },
    manual: false,
    fieldNames: {
      label: 'title',
      value: 'name',
    },
    onSuccess: (data) => {
      field.data = field.data || {};
      field.data.options = data?.data;
    },
  };
};

export class AttachmentURLFieldInterface extends CollectionFieldInterface {
  name = 'attachmentURL';
  type = 'object';
  group = 'media';
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
  properties = {
    target: {
      required: true,
      type: 'string',
      title: '{{t("Which file collection should it be uploaded to")}}',
      'x-decorator': 'FormItem',
      'x-component': 'RemoteSelect',
      'x-use-component-props': useAttachmentTargetProps,
      'x-reactions': (field) => {
        const options = field.data?.options || [];
        const hasAttachments = options.some((option) => option?.name === 'attachments');
        if (hasAttachments && !field.initialValue) {
          field.setInitialValue('attachments');
        }
      },
    },
    targetKey: {
      type: 'string',
      default: 'id',
      'x-hidden': true,
    },
  };
  filterable = {
    nested: true,
    operators: attachmentUrlOperators,
  };
  titleUsable = true;

  schemaInitialize(schema: ISchema, { block }) {
    schema['x-component-props'] = schema['x-component-props'] || {};
    schema['x-component-props'].mode = 'AttachmentUrl';
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'].ellipsis = true;
      schema['x-component-props'].size = 'small';
    }
  }
}
