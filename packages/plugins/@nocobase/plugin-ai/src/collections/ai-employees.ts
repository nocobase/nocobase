/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'aiEmployees',
  fields: [
    {
      name: 'username',
      type: 'string',
      primaryKey: true,
    },
    {
      name: 'nickname',
      type: 'string',
      interface: 'input',
    },
    {
      name: 'position',
      type: 'string',
      interface: 'input',
    },
    {
      name: 'avatar',
      type: 'string',
      interface: 'image',
    },
    {
      name: 'bio',
      type: 'text',
      interface: 'textarea',
    },
    {
      name: 'about',
      type: 'text',
      interface: 'textarea',
    },
    {
      name: 'greeting',
      type: 'text',
      interface: 'textarea',
    },
    {
      name: 'chatSettings',
      type: 'jsonb',
    },
    {
      name: 'skillSettings',
      type: 'jsonb',
    },
    {
      name: 'modelSettings',
      type: 'jsonb',
    },
    {
      name: 'dataSourceSettings',
      type: 'jsonb',
    },
    {
      name: 'enableKnowledgeBase',
      type: 'boolean',
      allowNull: false,
      defaultValue: false,
    },
    {
      name: 'knowledgeBasePrompt',
      type: 'text',
    },

    /**
     * knowledgeBase: {
     *  topK: number;
     *  score: string;
     *  knowledgeBaseIds: string[];
     * }
     */
    {
      name: 'knowledgeBase',
      type: 'jsonb',
    },
    {
      name: 'enabled',
      type: 'boolean',
      interface: 'switch',
      allowNull: false,
      defaultValue: true,
    },
  ],
};
