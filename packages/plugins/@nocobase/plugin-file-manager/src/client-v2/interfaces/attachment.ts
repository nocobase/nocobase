/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { CollectionFieldInterface } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class AttachmentFieldInterface extends CollectionFieldInterface {
  name = 'attachment';
  type = 'object';
  group = 'media';
  title = tExpr('Attachment');
  isAssociation = true;
  creatable = false;
  default = {
    interface: 'attachment',
    type: 'belongsToMany',
    target: 'attachments',
    uiSchema: {
      type: 'array',
      'x-component': 'Upload.Attachment',
      'x-use-component-props': 'useAttachmentFieldProps',
    },
  };
  availableTypes = ['belongsToMany'];
  configure = {
    items: [
      {
        name: 'target',
        title: tExpr('File collection'),
        component: 'Select' as const,
        required: true,
        defaultValue: 'attachments',
        schema: {
          enum: '{{fileCollections}}',
        },
      },
      {
        name: 'targetKey',
        defaultValue: 'id',
        hidden: true,
      },
      {
        name: 'uiSchema.x-component-props.accept',
        title: tExpr('MIME type'),
        component: 'Input' as const,
        componentProps: {
          placeholder: 'image/*',
        },
      },
      {
        name: 'uiSchema.x-component-props.multiple',
        title: tExpr('Allow uploading multiple files'),
        component: 'Checkbox' as const,
        defaultValue: true,
      },
    ],
  };
  filterable = {
    nested: true,
    children: [],
  };

  initialize(values: Record<string, unknown>) {
    if (!values.through) {
      values.through = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
    if (!values.otherKey) {
      values.otherKey = `f_${uid()}`;
    }
    if (!values.sourceKey) {
      values.sourceKey = 'id';
    }
    if (!values.targetKey) {
      values.targetKey = 'id';
    }
  }
}
