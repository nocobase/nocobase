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
  title: 'Tags',
  name: 'tags',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'string',
      name: 'name',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Name',
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Description',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'color',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Color',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'icon',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Icon',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'slug',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Slug',
        'x-component': 'Input',
      },
    },
    {
      type: 'boolean',
      name: 'isFeatured',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: 'Is Featured',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'integer',
      name: 'usageCount',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: 'Usage Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'integer',
      name: 'followerCount',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: 'Follower Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'json',
      name: 'synonyms',
      interface: 'json',
      uiSchema: {
        type: 'object',
        title: 'Synonyms',
        'x-component': 'Input.JSON',
      },
    },
    {
      type: 'boolean',
      name: 'isOfficial',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: 'Is Official',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'date',
      name: 'lastUsedAt',
      interface: 'date',
      uiSchema: {
        type: 'string',
        title: 'Last Used At',
        'x-component': 'DatePicker',
      },
    },
    {
      type: 'string',
      name: 'moderationStatus',
      defaultValue: 'approved',
      uiSchema: {
        type: 'string',
        'x-component': 'Select',
        enum: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    },
    {
      type: 'string',
      name: 'group',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Group',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'seoTitle',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'SEO Title',
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'seoDescription',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'SEO Description',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postTags',
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: 'Posts',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            value: 'id',
            label: 'name',
          },
        },
      },
    },
    {
      type: 'belongsToMany',
      name: 'subscribers',
      target: 'users',
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: 'Subscribers',
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
      type: 'belongsTo',
      name: 'curator',
      target: 'users',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Curator',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
      },
    },
    {
      type: 'text',
      name: 'reviewNotes',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Review Notes',
        'x-component': 'Input.TextArea',
      },
    },
  ],
} as CollectionOptions;
