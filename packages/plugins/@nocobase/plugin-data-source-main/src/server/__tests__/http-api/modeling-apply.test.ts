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
  let agent: any;

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
    expect(response.body.data.verify.valid).toBe(true);

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

  it('should create reverse relation fields from fields apply helper', async () => {
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
    const postsComments = posts.getField('comments');
    const commentsPost = comments.getField('post');

    const model = await app.db.getRepository('fields').findOne({
      filter: {
        collectionName: 'posts',
        name: 'comments',
      },
    });

    expect(model.get('reverseKey')).toBeDefined();
    expect(postsComments.options.type).toBe('hasMany');
    expect(commentsPost.options.type).toBe('belongsTo');
    expect(commentsPost.options.target).toBe('posts');
    expect(commentsPost.options.uiSchema.title).toBe('Post');
    expect(postsComments.options.foreignKey).toBe(commentsPost.options.foreignKey);
    // expect(postsComments.options.reverseKey).toBeDefined();
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
    expect(response.body.data.verify.valid).toBe(true);

    const categories = app.db.getCollection('categories');
    expect([...categories.fields.keys()]).toEqual(expect.arrayContaining(['parentId', 'parent', 'children', 'title']));
  });

  it('should apply a file collection with template defaults', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['file-manager'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'files',
        title: '文件',
        template: 'file',
        fields: [{ name: 'title', title: '文件标题', interface: 'input' }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.verify.valid).toBe(true);

    const files = app.db.getCollection('files');
    expect(files).toBeDefined();
    expect(files.hasField('meta')).toBe(true);
    expect(files.getField('meta').options.interface).toBe('json');
    expect(files.getField('meta').options.type).toBe('jsonb');
    expect(files.getField('title').options.uiSchema.title).toBe('文件标题');
  });

  it('should apply a file collection from template baseline without custom fields', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['file-manager'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'asset_files',
        title: '资源文件',
        template: 'file',
        fields: [],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.verify.valid).toBe(true);

    const files = app.db.getCollection('asset_files');
    expect(files).toBeDefined();
    expect(files.getField('title').options.interface).toBe('input');
    expect(files.getField('path').options.interface).toBe('textarea');
    expect(files.getField('meta').options.interface).toBe('json');
    expect(files.getField('meta').options.type).toBe('jsonb');
  });

  it('should apply a calendar collection with template defaults', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'events',
        title: 'Events',
        template: 'calendar',
        fields: [{ name: 'subject', title: 'Subject', interface: 'input' }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.verify.valid).toBe(true);

    const events = app.db.getCollection('events');
    expect(events).toBeDefined();
    expect(events.hasField('exclude')).toBe(true);
    expect(events.getField('exclude').options.interface).toBe('json');
    expect(events.getField('exclude').options.type).toBe('json');
  });

  it('should reject unknown field interfaces', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'broken_interfaces',
        template: 'general',
        fields: [{ name: 'content', interface: 'not-real-interface' }],
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.errors[0].message).toContain('Unknown field interface not-real-interface');
  });

  it('should reject mismatched field types', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'broken_types',
        template: 'general',
        fields: [{ name: 'content', interface: 'markdown', type: 'json' }],
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.errors[0].message).toContain('type json does not match interface markdown');
  });

  it('should preserve explicit relation keys from compact field input', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'customers',
      },
    });

    const response = await agent.resource('collections').apply({
      values: {
        name: 'orders',
        template: 'general',
        fields: [
          {
            name: 'customer',
            interface: 'm2o',
            target: 'customers',
            foreignKey: 'customerId',
            targetKey: 'id',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const orders = app.db.getCollection('orders');
    expect(orders.getField('customer').options.foreignKey).toBe('customerId');
    expect(orders.getField('customer').options.targetKey).toBe('id');
  });

  it('should derive readable belongs-to foreign keys from compact field input', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'customers',
      },
    });

    const response = await agent.resource('collections').apply({
      values: {
        name: 'orders',
        template: 'general',
        fields: [
          {
            name: 'customer',
            interface: 'm2o',
            target: 'customers',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const orders = app.db.getCollection('orders');
    expect(orders.getField('customer').options.foreignKey).toBe('customerId');
    expect(orders.getField('customer').options.targetKey).toBe('id');
  });

  it('should derive readable has-many foreign keys from compact field input', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'orders',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'order_items',
      },
    });

    const response = await agent.resource('fields').apply({
      values: {
        collectionName: 'orders',
        name: 'items',
        interface: 'o2m',
        target: 'order_items',
        reverseName: 'order',
      },
    });

    expect(response.statusCode).toBe(200);

    const orders = app.db.getCollection('orders');
    const orderItems = app.db.getCollection('order_items');

    expect(orders.getField('items').options.foreignKey).toBe('orderId');
    expect(orders.getField('items').options.sourceKey).toBe('id');
    expect(orderItems.getField('order').options.foreignKey).toBe('orderId');
  });

  it('should derive readable belongs-to-many relation keys from compact field input', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'posts',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'tags',
      },
    });

    const response = await agent.resource('fields').apply({
      values: {
        collectionName: 'posts',
        name: 'tags',
        interface: 'm2m',
        target: 'tags',
      },
    });

    expect(response.statusCode).toBe(200);

    const posts = app.db.getCollection('posts');
    expect(posts.getField('tags').options.foreignKey).toBe('postId');
    expect(posts.getField('tags').options.otherKey).toBe('tagId');
    expect(posts.getField('tags').options.through).toBe('postsTags');
  });

  it('should normalize formula fields with formula result defaults', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['field-formula'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'scores',
        template: 'general',
        fields: [
          {
            name: 'total',
            interface: 'formula',
            expression: 'SUM({{a}}, {{b}})',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const scores = app.db.getCollection('scores');
    const total = scores.getField('total');

    expect(total.options.type).toBe('formula');
    expect(total.options.engine).toBe('formula.js');
    expect(total.options.uiSchema['x-component']).toBe('Formula.Result');
    expect(total.options.uiSchema['x-read-pretty']).toBe(true);
  });

  it('should normalize vditor fields when plugin is enabled', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['field-markdown-vditor'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'docs',
        template: 'general',
        fields: [
          {
            name: 'content',
            interface: 'vditor',
            title: 'Content',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const docs = app.db.getCollection('docs');
    const content = docs.getField('content');

    expect(content.options.interface).toBe('vditor');
    expect(content.options.type).toBe('text');
    expect(content.options.uiSchema['x-component']).toBe('MarkdownVditor');
  });

  it('should reject formula fields without expression', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['field-formula'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'broken_formula',
        template: 'general',
        fields: [
          {
            name: 'total',
            interface: 'formula',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.errors[0].message).toContain('requires expression');
  });

  it('should normalize tableoid fields to virtual collection select fields', async () => {
    const response = await agent.resource('collections').apply({
      values: {
        name: 'tableoid_samples',
        template: 'general',
        fields: [{ interface: 'tableoid' }],
      },
    });

    expect(response.statusCode).toBe(200);

    const collection = app.db.getCollection('tableoid_samples');
    const tableoid = collection.getField('__collection');

    expect(tableoid.options.interface).toBe('tableoid');
    expect(tableoid.options.type).toBe('virtual');
    expect(tableoid.options.uiSchema['x-component']).toBe('CollectionSelect');
    expect(tableoid.options.uiSchema['x-component-props']).toMatchObject({
      isTableOid: true,
    });
  });

  it('should normalize map geometry fields when plugin is enabled', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['map'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'stores',
        template: 'general',
        fields: [
          {
            name: 'location',
            interface: 'point',
            title: 'Location',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const stores = app.db.getCollection('stores');
    const location = stores.getField('location');

    expect(location.options.interface).toBe('point');
    expect(location.options.type).toBe('point');
    expect(location.options.uiSchema['x-component']).toBe('Map');
    expect(location.options.uiSchema['x-component-designer']).toBe('Map.Designer');
    expect(location.options.uiSchema.type).toBe('void');
  });

  it('should normalize other map geometry field variants when plugin is enabled', async () => {
    await app.destroy();
    app = await createApp({
      plugins: ['map'],
    });
    agent = app.agent();

    const response = await agent.resource('collections').apply({
      values: {
        name: 'delivery_areas',
        template: 'general',
        fields: [
          { name: 'route', interface: 'lineString', title: 'Route' },
          { name: 'serviceArea', interface: 'circle', title: 'Service area' },
          { name: 'boundary', interface: 'polygon', title: 'Boundary' },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const collection = app.db.getCollection('delivery_areas');

    for (const [fieldName, expectedType] of [
      ['route', 'lineString'],
      ['serviceArea', 'circle'],
      ['boundary', 'polygon'],
    ] as const) {
      const field = collection.getField(fieldName);
      expect(field.options.interface).toBe(expectedType);
      expect(field.options.type).toBe(expectedType);
      expect(field.options.uiSchema['x-component']).toBe('Map');
      expect(field.options.uiSchema['x-component-designer']).toBe('Map.Designer');
      expect(field.options.uiSchema.type).toBe('void');
    }
  });
});
