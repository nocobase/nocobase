/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('modeling apply actions', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should apply a collection with template defaults and verification', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'orders',
        template: 'general',
        fields: [
          {
            name: 'status',
            title: 'Status',
            interface: 'select',
            enum: ['draft', 'paid'],
          },
          {
            name: 'customer',
            title: 'Customer',
            interface: 'm2o',
            target: 'users',
            targetTitleField: 'nickname',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.verify.valid).toBe(true);

    const collection = app.db.getCollection('orders');
    expect(collection).toBeDefined();
    expect(collection.hasField('createdAt')).toBe(true);
    expect(collection.hasField('createdBy')).toBe(true);
    expect(collection.hasField('updatedAt')).toBe(true);
    expect(collection.hasField('updatedBy')).toBe(true);

    const statusField = collection.getField('status');
    expect(statusField.options.type).toBe('string');
    expect(statusField.options.uiSchema.title).toBe('Status');
    expect(statusField.options.uiSchema.enum).toEqual([
      { label: 'draft', value: 'draft' },
      { label: 'paid', value: 'paid' },
    ]);

    const customerField = collection.getField('customer');
    expect(customerField.options.type).toBe('belongsTo');
    expect(customerField.options.target).toBe('users');
    expect(customerField.options.uiSchema['x-component']).toBe('AssociationField');
    expect(customerField.options.uiSchema['x-component-props'].fieldNames).toMatchObject({
      value: 'id',
      label: 'nickname',
    });
  });

  it('should create relation reverse field from fields apply helper', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'posts',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'comments',
      },
    });

    const response = await agent.resource('fields').apply({
      values: {
        collectionName: 'posts',
        name: 'comments',
        title: 'Comments',
        interface: 'o2m',
        target: 'comments',
        reverseName: 'post',
        reverseTitle: 'Post',
      },
    });

    expect(response.statusCode).toBe(200);

    const posts = app.db.getCollection('posts');
    const comments = app.db.getCollection('comments');

    expect(posts.getField('comments').options.type).toBe('hasMany');
    expect(posts.getField('comments').options.reverseKey).toBeDefined();
    expect(comments.getField('post').options.type).toBe('belongsTo');
    expect(comments.getField('post').options.target).toBe('posts');
    expect(comments.getField('post').options.uiSchema.title).toBe('Post');
  });

  it('should return normalized verification result from collections apply', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'categories',
        template: 'tree',
        fields: [{ name: 'title', interface: 'input', title: 'Title' }],
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.verify.valid).toBe(true);

    const categories = app.db.getCollection('categories');
    expect([...categories.fields.keys()]).toEqual(expect.arrayContaining(['parentId', 'parent', 'children', 'title']));
  });
});
