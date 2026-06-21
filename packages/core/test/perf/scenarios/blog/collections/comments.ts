/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default {
  title: 'Comments',
  name: 'comments',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'text',
      name: 'content',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Content',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'authorName',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Author Name',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'authorEmail',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Author Email',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'authorUrl',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Author URL',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'ipAddress',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'IP Address',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'userAgent',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'User Agent',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'pending',
      uiSchema: {
        type: 'string',
        title: 'Status',
        'x-component': 'Select',
        enum: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    },
    {
      type: 'integer',
      name: 'likeCount',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'Like Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'integer',
      name: 'dislikeCount',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'Dislike Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'integer',
      name: 'rating',
      interface: 'number',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'Rating',
        'x-component': 'InputNumber',
        'x-component-props': {
          step: 0.1,
          min: 0,
          max: 5,
        },
      },
    }, // 1-5
    {
      type: 'boolean',
      name: 'isApproved',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'string',
        title: 'Is Approved',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'boolean',
      name: 'isFeatured',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'string',
        title: 'Is Featured',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'boolean',
      name: 'isSticky',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'string',
        title: 'Is Sticky',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'string',
      name: 'path',
      interface: 'input',
      uiSchema: {
        type: 'string',
        uiSchema: {
          type: 'string',
          title: 'Path',
          'x-component': 'Input',
        },
      },
    }, // For threaded comments (materialized path)
    {
      type: 'belongsTo',
      name: 'post',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Post',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'title',
          },
        },
      },
    },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'comments',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Parent Comment',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'id',
          },
        },
      },
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'comments',
      foreignKey: 'parentId',
      interface: 'o2m',
      uiSchema: {
        type: 'array',
        title: 'Child Comments',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            value: 'id',
            label: 'id',
          },
        },
      },
    },
    {
      type: 'belongsToMany',
      name: 'mentions',
      target: 'users',
      interface: 'm2m',
      uiSchema: {
        type: 'object',
        title: 'Mentions',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
      },
    },
    {
      type: 'json',
      name: 'attachments',
      interface: 'json',
      uiSchema: {
        type: 'object',
        title: 'Attachments',
        'x-component': 'Input.JSON',
      },
    },
    {
      type: 'text',
      name: 'moderationNotes',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Moderation Notes',
        'x-component': 'Input.TextArea',
      },
    },
  ],
} as CollectionOptions;
