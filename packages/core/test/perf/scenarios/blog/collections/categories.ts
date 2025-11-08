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
  title: 'Categories',
  name: 'categories',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'string',
      name: 'title',
      unique: true,
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
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Sub Title',
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'description',
      unique: true,
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Description',
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
    { type: 'sort', name: 'sort' },
    {
      type: 'string',
      name: 'coverImageUrl',
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: 'Cover Image URL',
        'x-component': 'Input.URL',
      },
    },
    {
      type: 'string',
      name: 'url',
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: 'URL',
        'x-component': 'Input.URL',
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
      type: 'integer',
      name: 'articleCount',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: 'Article Count',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'date',
      name: 'lastPostedAt',
      interface: 'date',
      uiSchema: {
        type: 'string',
        title: 'Last Posted At',
        'x-component': 'DatePicker',
      },
    },
    {
      type: 'boolean',
      name: 'hidden',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: 'Hidden',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'string',
      name: 'themeColor',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Theme Color',
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
      type: 'boolean',
      name: 'allowComments',
      defaultValue: true,
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: 'Allow Comments',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'categories',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Parent',
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
      name: 'posts',
      interface: 'o2m',
      uiSchema: {
        type: 'array',
        title: 'Posts',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            value: 'id',
            label: 'title',
          },
        },
      },
    },
    {
      type: 'belongsTo',
      name: 'moderator',
      target: 'users',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: 'Moderator',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
      },
    },
  ],
} as CollectionOptions;
