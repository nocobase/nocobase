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
  title: 'Posts',
  name: 'posts',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Title',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'subTitle',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Sub Title',
        'x-component': 'Input',
      },
    },
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
      type: 'string',
      name: 'musicUrl',
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: 'Music URL',
        'x-component': 'Input.URL',
      },
    },
    {
      type: 'text',
      name: 'excerpt',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Excerpt',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'coverImage',
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: 'Cover Image',
        'x-component': 'Input.URL',
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'draft', // 'draft', 'published', 'archived'
      uiSchema: {
        type: 'string',
        title: 'Status',
        'x-component': 'Select',
        enum: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    },
    {
      type: 'boolean',
      name: 'allowComments',
      interface: 'checkbox',
      defaultValue: true,
      uiSchema: {
        type: 'string',
        title: 'Allow Comments',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'boolean',
      name: 'featured',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'string',
        title: 'Featured',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'date',
      name: 'publishedAt',
      interface: 'date',
      uiSchema: {
        type: 'string',
        title: 'Published At',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
      },
    },
    {
      type: 'integer',
      name: 'viewCount',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'View Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'integer',
      name: 'read',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'Read',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'belongsTo',
      name: 'category',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Category',
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
      type: 'hasMany',
      name: 'comments',
      interface: 'o2m',
      uiSchema: {
        type: 'array',
        title: 'Comments',
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
      name: 'tags',
      through: 'postTags',
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: 'Tags',
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
      type: 'double',
      name: 'score',
      interface: 'number',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: 'Score',
        'x-component': 'InputNumber',
        'x-component-props': {
          step: 0.1,
          min: 0,
          max: 5,
        },
      },
    },
    {
      type: 'date',
      name: 'createdAt',
      interface: 'createdAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
    {
      type: 'date',
      name: 'updatedAt',
      interface: 'updatedAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
  ],
} as CollectionOptions;
