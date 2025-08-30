/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildWrapperFieldChildren } from '../utils';
import { Collection } from '../../../data-source';
import { FlowEngine } from '../../../flowEngine';
import { FlowModel } from '../../../models';

describe('buildWrapperFieldChildren', () => {
  it('generates a group with children per field and correct defaults', () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    const collection = new Collection({
      name: 'posts',
      fields: [
        { name: 'title', interface: 'input', title: 'Title' },
        { name: 'status', interface: 'select', title: 'Status' },
        { name: 'ignored', interface: undefined },
      ],
    });
    collection.setDataSource(ds);
    ds.addCollection(collection);
    const model = engine.createModel({ use: 'FlowModel' });
    const ctx = model.context;
    ctx.defineProperty('collection', { value: collection });

    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'TableColumnModel',
      fieldUseModel: 'ReadPrettyFieldModel',
    });

    expect(groups).toHaveLength(1);
    const group = groups[0];
    expect(group.key).toBe('addField');
    expect(group.type).toBe('group');
    expect(group.searchable).toBe(true);
    expect(group.searchPlaceholder).toBe('Search fields');

    const children = group.children as any[];
    // filters out field without interface
    expect(children.map((c) => c.key)).toEqual(['title', 'status']);
    expect(children.map((c) => c.label)).toEqual(['Title', 'Status']);
    // wrapper model is fixed from options
    children.forEach((c) => expect(c.useModel).toBe('TableColumnModel'));
  });

  it('resolves child use via fieldUseModel function and builds stepParams', async () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    const collection = new Collection({
      name: 'posts',
      fields: [
        { name: 'title', interface: 'input', title: 'Title' },
        { name: 'status', interface: 'select', title: 'Status' },
      ],
    });
    collection.setDataSource(ds);
    ds.addCollection(collection);
    const model = engine.createModel({ use: 'FlowModel' });
    const ctx = model.context;
    ctx.defineProperty('collection', { value: collection });

    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'DetailItemModel',
      fieldUseModel: (f) => (f.interface === 'select' ? 'SelectPrettyFieldModel' : 'ReadPrettyFieldModel'),
    });

    const group = groups[0];
    const children = group.children;
    const titleItem = children.find((c) => c.key === 'title');
    const statusItem = children.find((c) => c.key === 'status');

    const titleCreate = await (typeof titleItem.createModelOptions === 'function'
      ? titleItem.createModelOptions(ctx)
      : titleItem.createModelOptions);
    const statusCreate = await (typeof statusItem.createModelOptions === 'function'
      ? statusItem.createModelOptions(ctx)
      : statusItem.createModelOptions);

    expect(titleCreate.use).toBe('DetailItemModel');
    expect(titleCreate.stepParams).toEqual({
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'posts',
          fieldPath: 'title',
        },
      },
    });
    expect(titleCreate.subModels.field.use).toBe('ReadPrettyFieldModel');
    expect(titleCreate.subModels.field.stepParams).toEqual({
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'posts',
          fieldPath: 'title',
        },
      },
    });

    expect(statusCreate.subModels.field.use).toBe('SelectPrettyFieldModel');
    expect(statusCreate.stepParams.fieldSettings.init.fieldPath).toBe('status');
  });

  it('toggleable checks step params for fieldPath (using real FlowModel)', () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    const collection = new Collection({
      name: 'posts',
      fields: [
        { name: 'title', interface: 'input', title: 'Title' },
        { name: 'status', interface: 'select', title: 'Status' },
      ],
    });
    collection.setDataSource(ds);
    ds.addCollection(collection);
    const model = engine.createModel({ use: 'FlowModel' });
    const ctx = model.context;
    ctx.defineProperty('collection', { value: collection });
    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'TableColumnModel',
      fieldUseModel: 'ReadPrettyFieldModel',
    });
    const group = groups[0];
    const [titleItem, statusItem] = group.children;

    // create real FlowModel instances and set stepParams
    const titleModel = engine.createModel<FlowModel>({ use: 'FlowModel' });
    titleModel.setStepParams('fieldSettings', 'init', { fieldPath: 'title' });
    const statusModel = engine.createModel<FlowModel>({ use: 'FlowModel' });
    statusModel.setStepParams('fieldSettings', 'init', { fieldPath: 'status' });

    expect((titleItem.toggleable as (model: FlowModel) => boolean)(titleModel)).toBe(true);
    expect((titleItem.toggleable as (model: FlowModel) => boolean)(statusModel)).toBe(false);
    expect((statusItem.toggleable as (model: FlowModel) => boolean)(statusModel)).toBe(true);
  });

  it('prefers ctx.model.collection over ctx.collection for sub-table scenario', async () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    // Main collection (block-level)
    const posts = new Collection({
      name: 'posts',
      fields: [
        { name: 'title', interface: 'input', title: 'Title' },
        { name: 'category', interface: 'select', title: 'Category' },
      ],
    });
    posts.setDataSource(ds);
    ds.addCollection(posts);

    // Target collection (association sub-table)
    const comments = new Collection({
      name: 'comments',
      fields: [
        { name: 'content', interface: 'input', title: 'Content' },
        { name: 'status', interface: 'select', title: 'Status' },
      ],
    });
    comments.setDataSource(ds);
    ds.addCollection(comments);

    // we can't import the real sub table model, as they are in client core package
    const model = engine.createModel({ use: 'FlowModel' });
    const ctx = model.context;
    // Block context collection is posts
    ctx.defineProperty('collection', { value: posts });
    // But model.collection points to the association target collection
    (model as any).collection = comments;

    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'SubTableColumnModel',
      fieldUseModel: 'FormFieldModel',
    });
    const group = groups[0];
    const children = group.children as any[];
    expect(children.map((c) => c.key)).toEqual(['content', 'status']);

    const contentItem = children.find((c) => c.key === 'content');
    const contentCreate = await (typeof contentItem.createModelOptions === 'function'
      ? contentItem.createModelOptions(ctx)
      : contentItem.createModelOptions);
    expect(contentCreate.stepParams.fieldSettings.init.collectionName).toBe('comments');
  });
});
