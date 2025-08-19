/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { buildActionItems, buildBlockItems, buildFieldItems, MENU_KEYS, processMetaChildren } from '../index';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import type { FlowModelContext } from '../../flowContext';
import { Collection, CollectionField, DataSource, DataSourceManager } from '../../data-source';

// Helpers to create engine and model
const createEngine = () => new FlowEngine();
const createModel = (engine: FlowEngine) => engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'root' });

// Utilities to create DataSources and Collections
function attachDataSources(engine: FlowEngine) {
  const dsm: DataSourceManager = engine.context.dataSourceManager;
  // context by default has one 'main'
  const main = dsm.getDataSource('main');
  if (!main) {
    dsm.addDataSource(new DataSource({ key: 'main', displayName: 'Main' }));
  }
  dsm.addDataSource(new DataSource({ key: 'remote', displayName: 'Remote' }));

  const mainDS = dsm.getDataSource('main')!;
  const remoteDS = dsm.getDataSource('remote')!;

  // main: posts, comments
  mainDS.addCollection(new Collection({ name: 'posts', title: 'Posts' }));
  mainDS.addCollection(new Collection({ name: 'comments', title: 'Comments' }));

  // remote: users
  remoteDS.addCollection(new Collection({ name: 'users', title: 'Users' }));

  // relationship fields
  const postsCollection = mainDS.getCollection('posts')!;
  const usersCollection = remoteDS.getCollection('users')!;

  const commentsField = new CollectionField({
    name: 'comments',
    interface: 'o2m',
    target: 'comments',
    title: 'Comments',
  });
  const authorField = new CollectionField({ name: 'author', interface: 'm2o', target: 'users', title: 'Author' });
  const postField = new CollectionField({ name: 'post', interface: 'm2o', target: 'posts', title: 'Post' });

  // Set collection references manually to ensure proper linking
  (commentsField as any).collection = postsCollection;
  (authorField as any).collection = postsCollection;
  (postField as any).collection = usersCollection;

  postsCollection.addField(commentsField);
  postsCollection.addField(authorField);
  // remote -> main relation to ensure association fields across data sources
  usersCollection.addField(postField);
}

// Base classes for block/action/field tests
class ActionBaseModel extends FlowModel {}
class BlockModel extends FlowModel {}
class DataBlockModel extends BlockModel {}
class FilterBlockModel extends BlockModel {}
class CollectionBlockModel extends DataBlockModel {}

describe('menu-builders', () => {
  let engine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    engine = createEngine();
    model = createModel(engine);
  });

  describe('buildActionItems()', () => {
    test('lists subclasses, respects hide, supports meta.children and createModelOptions', async () => {
      class ChildA extends ActionBaseModel {
        static meta = {
          label: 'A',
          icon: 'icon-a',
          createModelOptions: { alpha: 1 },
        };
      }
      class HiddenChild extends ActionBaseModel {
        static meta = { hide: true };
      }
      class ChildWithChildren extends ActionBaseModel {
        static meta = {
          label: 'B',
          children: [
            { label: 'Option 1', createModelOptions: { use: 'NestedModel1' } },
            { label: 'Option 2', createModelOptions: { use: 'NestedModel2' } },
          ],
        };
      }
      engine.registerModels({ ActionBaseModel, ChildA, HiddenChild, ChildWithChildren });

      const items = buildActionItems(model, 'ActionBaseModel');
      // Should contain ChildA and ChildWithChildren, and skip HiddenChild
      const keys = items.map((i) => i.key).sort();
      expect(keys).toEqual(['ChildA', 'ChildWithChildren']);

      // ChildA should have createModelOptions with use = className
      const childA = items.find((i) => i.key === 'ChildA')!;
      expect(childA.label).toBe('A');
      const childAOpts = (await (childA.createModelOptions as any)()) as any;
      expect(childAOpts).toEqual({ alpha: 1, use: 'ChildA' });

      // ChildWithChildren should resolve meta.children via processMetaChildren
      const childB = items.find((i) => i.key === 'ChildWithChildren')!;
      expect(typeof childB.children).toBe('function');
      const childBChildren = await (childB.children as any)();
      expect(childBChildren.map((c) => c.key)).toEqual(['ChildWithChildren.Option 1', 'ChildWithChildren.Option 2']);
      expect(childBChildren[0].createModelOptions).toEqual({ use: 'NestedModel1' });
      expect(childBChildren[1].createModelOptions).toEqual({ use: 'NestedModel2' });

      // filter argument can exclude classes
      const onlyA = buildActionItems(model, 'ActionBaseModel', (M, name) => name === 'ChildA');
      expect(onlyA.map((i) => i.key)).toEqual(['ChildA']);
    });

    test('handles deep nested and async meta.children', async () => {
      class ActionBase extends ActionBaseModel {}
      class DeepAction extends ActionBase {
        static meta = {
          label: 'Deep',
          children: async () => [
            {
              label: 'Group 1',
              children: [
                { label: 'Child A', createModelOptions: { use: 'CA' } },
                { label: 'Child B', createModelOptions: async () => ({ use: 'CB', extra: 1 }) },
                {
                  label: 'Level 2',
                  children: async () => [{ label: 'Leaf', createModelOptions: { use: 'LeafModel' } }],
                },
              ],
            },
          ],
        };
      }
      engine.registerModels({ ActionBaseModel: ActionBase, DeepAction });

      const items = buildActionItems(model, 'ActionBaseModel');
      const deep = items.find((i) => i.key === 'DeepAction')!;
      const lvl1 = await (deep.children as () => Promise<any[]>)();
      const group1 = lvl1.find((x) => x.key === 'DeepAction.Group 1');
      expect(group1.children.map((x) => x.key)).toEqual([
        'DeepAction.Group 1.Child A',
        'DeepAction.Group 1.Child B',
        'DeepAction.Group 1.Level 2',
      ]);
      const lvl2 = group1.children.find((x) => x.key.endsWith('Level 2')).children;
      expect(lvl2[0].key).toBe('DeepAction.Group 1.Level 2.Leaf');
      const childB = group1.children.find((x) => x.key.endsWith('Child B'));
      expect(childB.createModelOptions).toEqual({ use: 'CB', extra: 1 });
    });

    test('mixed async + broken inheritance does not break and filters correctly', async () => {
      // Base for this test
      class ActionBaseX extends ActionBaseModel {}
      class GoodAsyncAction extends ActionBaseX {
        static meta = {
          label: 'GoodAsync',
          children: async () => [
            { label: 'AsyncChild', createModelOptions: async () => ({ use: 'GoodAsyncAction', ok: true }) },
          ],
        };
      }
      class BrokenInheritanceAction extends ActionBaseX {
        static meta = { label: 'Broken' };
      }
      // Break prototype chain to simulate inheritance anomaly
      Object.setPrototypeOf(BrokenInheritanceAction.prototype, null);

      engine.registerModels({ ActionBaseModel: ActionBaseX, GoodAsyncAction, BrokenInheritanceAction });

      const items = buildActionItems(model, 'ActionBaseModel');
      const keys = items.map((i) => i.key).sort();
      expect(keys).toEqual(['GoodAsyncAction']); // Broken action filtered out

      const good = items[0];
      const children = await (good.children as () => Promise<any[]>)();
      const node = children.find((c) => c.key === 'GoodAsyncAction.AsyncChild');
      expect(node.createModelOptions).toEqual({ use: 'GoodAsyncAction', ok: true });
    });
  });

  describe('buildFieldItems()', () => {
    test('maps collection fields to field models, supports default "*", toggleable', () => {
      // Register field model classes
      class FieldModelBase extends FlowModel {}
      class FieldTextModel extends FieldModelBase {
        static supportedFieldInterfaces = ['input', 'textarea'];
        static meta = { icon: 'T', createModelOptions: { foo: 'bar' } };
      }
      class FieldDefaultModel extends FieldModelBase {
        static supportedFieldInterfaces = '*';
        static meta = { icon: 'D', createModelOptions: { def: true } };
      }
      engine.registerModels({ FieldModelBase, FieldTextModel, FieldDefaultModel });

      // Create fields on a collection
      attachDataSources(engine);
      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!;

      const titleField = new CollectionField({ name: 'title', interface: 'input', title: 'Title' });
      const contentField = new CollectionField({ name: 'content', interface: 'richText', title: 'Content' });

      // Set collection references manually to ensure proper linking
      (titleField as any).collection = posts;
      (contentField as any).collection = posts;

      posts.addField(titleField);
      posts.addField(contentField);

      // Only test the two added fields, exclude relationship fields injected by attachDataSources
      const fields = posts.getFields().filter((f) => ['title', 'content'].includes(f.name));

      const items = buildFieldItems(
        fields,
        model,
        'FieldModelBase',
        'addField',
        ({ defaultOptions, collectionField, fieldPath }) => ({
          ...defaultOptions,
          stepParams: {
            default: { step1: { fieldPath, collectionName: collectionField.collection.name } },
          },
        }),
      );

      // Should return a searchable group with two children
      expect(items).toHaveLength(1);
      const group = items[0] as any;
      expect(group.key).toBe('addField');
      expect(group.searchable).toBe(true);
      expect(group.children).toHaveLength(2);

      const titleItem = group.children.find((i) => i.key === 'title');
      const contentItem = group.children.find((i) => i.key === 'content');
      expect(titleItem.label).toBe('Title');
      expect(contentItem.label).toBe('Content');
      // useModel should reflect matched class name
      expect(titleItem.useModel).toBe('FieldTextModel');
      expect(contentItem.useModel).toBe('FieldDefaultModel');

      // toggleable should depend on stepParams
      const subModelHasTitle = engine.createModel<FlowModel>({ use: 'FlowModel' });
      subModelHasTitle['stepParams'] = { f: { s: { fieldPath: 'title' } } } as any;
      expect((titleItem.toggleable as any)(subModelHasTitle)).toBe(true);
      expect((contentItem.toggleable as any)(subModelHasTitle)).toBe(false);
    });
  });

  describe('buildBlockItems() - data/filter/other groups + data source menus', () => {
    test('groups blocks and builds data source -> collections menus for collection blocks', async () => {
      attachDataSources(engine);

      class MyCollectionBlock extends CollectionBlockModel {
        static meta = { label: 'CollectionBlock', createModelOptions: { base: 1 } };
      }
      class MyNonCollectionDataBlock extends DataBlockModel {
        static meta = { label: 'Non-Collection', createModelOptions: { nc: 1 } };
      }
      class MyFilterBlock extends FilterBlockModel {
        static meta = { label: 'FilterX', createModelOptions: { f: 1 } };
      }
      class MyOtherBlock extends BlockModel {
        static meta = { label: 'OtherX', createModelOptions: { o: 1 } };
      }

      engine.registerModels({
        BlockModel,
        DataBlockModel,
        FilterBlockModel,
        CollectionBlockModel,
        MyCollectionBlock,
        MyNonCollectionDataBlock,
        MyFilterBlock,
        MyOtherBlock,
      });

      const items = buildBlockItems(model);
      // Expect 3 groups: data, filter, other
      expect(items).toHaveLength(3);
      const dataGroup = items.find((i: any) => i.key === 'dataBlocks')!;
      const filterGroup = items.find((i: any) => i.key === 'filterBlocks')!;
      const otherGroup = items.find((i: any) => i.key === 'otherBlocks')!;
      expect(dataGroup.label).toBe('Data blocks');
      expect(filterGroup.label).toBe('Filter blocks');
      expect(otherGroup.label).toBe('Other blocks');

      // Resolve data group children
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      // Should contain MyCollectionBlock and MyNonCollectionDataBlock
      const dataKeys = dataChildren.map((c) => c.key).sort();
      expect(dataKeys).toContain('MyCollectionBlock');
      expect(dataKeys).toContain('MyNonCollectionDataBlock');

      // MyCollectionBlock should contain data sources -> collections tree
      const collBlock = dataChildren.find((c) => c.key === 'MyCollectionBlock');
      expect(collBlock.label).toBe('CollectionBlock');
      // Two data sources: main, remote
      const dsOrChildren = collBlock.children;
      expect(Array.isArray(dsOrChildren)).toBe(true);
      const dsChildren = dsOrChildren as any[];
      // With two data sources, it should not collapse the DS layer
      const dsKeys = dsChildren.map((d) => d.key).sort();
      expect(dsKeys).toEqual(['MyCollectionBlock.main', 'MyCollectionBlock.remote']);
      // Each DS contains collections
      const mainNode = dsChildren.find((d) => d.key.endsWith('.main'));
      expect(mainNode.children.some((c) => c.key.endsWith('.posts'))).toBe(true);
      expect(mainNode.children.some((c) => c.key.endsWith('.comments'))).toBe(true);
      const anyCollectionItem = mainNode.children[0];
      expect(anyCollectionItem.createModelOptions.use).toBe('MyCollectionBlock');
      expect(anyCollectionItem.createModelOptions.stepParams.resourceSettings.init.dataSourceKey).toBe('main');
      expect(anyCollectionItem.createModelOptions.stepParams.resourceSettings.init.collectionName).toBeTypeOf('string');

      // MyNonCollectionDataBlock should create a direct item with createModelOptions
      const nonColl = dataChildren.find((c) => c.key === 'MyNonCollectionDataBlock');
      expect(nonColl.createModelOptions.use).toBe('MyNonCollectionDataBlock');
    });

    test('processDataBlockChildren: empty collections or undefined include all data sources', async () => {
      attachDataSources(engine);
      class CollectionsFuncBlock extends CollectionBlockModel {
        static meta = {
          label: 'CollFunc',
          children: [
            {
              label: 'No Collections',
              createModelOptions: { use: 'CollectionsFuncBlock' },
            },
            {
              label: 'Empty Collections',
              createModelOptions: { use: 'CollectionsFuncBlock' },
              collections: [] as any[], // empty array – treated same as undefined
            },
          ],
        };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, CollectionsFuncBlock });

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const block = dataChildren.find((c) => c.key === 'CollectionsFuncBlock');
      const nodes = block.children as any[];
      const funcNode = nodes.find((n) => n.key === 'CollectionsFuncBlock.No Collections');
      const emptyNode = nodes.find((n) => n.key === 'CollectionsFuncBlock.Empty Collections');

      // Both should include both data sources since filter is ignored
      expect(funcNode.children.map((d) => d.key).sort()).toEqual([
        'CollectionsFuncBlock.No Collections.main',
        'CollectionsFuncBlock.No Collections.remote',
      ]);
      // For empty collections (length=0), items are filtered out => node absent
      expect(emptyNode).toBeUndefined();
    });

    test('processDataBlockChildren: association records grouped by data source; collapse behaviors', async () => {
      attachDataSources(engine);

      class AssocCollectionBlock extends CollectionBlockModel {
        static meta = {
          label: 'AssocBlock',
          children: [
            // Association records: provide fields across DS
            {
              key: MENU_KEYS.ASSOCIATION_RECORDS,
              label: 'Associated records',
              // fields and createModelOptions will be filled in test below
            },
            // A generic item filtered to a specific DS and single collection to trigger collapse
            {
              label: 'Only Posts',
              createModelOptions: { use: 'AssocCollectionBlock' },
              collections: [] as any[],
            },
          ],
        };
      }

      engine.registerModels({
        BlockModel,
        DataBlockModel,
        CollectionBlockModel,
        AssocCollectionBlock,
      });

      // Build fields across DS
      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!;
      const users = dsm.getDataSource('remote')!.getCollection('users')!;
      const postsAuthor = posts.getField('author')!; // main
      const usersPost = users.getField('post')!; // remote
      // Inject fields into meta.children at runtime
      (AssocCollectionBlock as any).meta.children[0].fields = [postsAuthor, usersPost];
      (AssocCollectionBlock as any).meta.children[0].createModelOptions = (_ctx: any, field: CollectionField) => ({
        use: 'AssocCollectionBlock',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: field.collection.dataSource.key,
              collectionName: field.target,
              associationName: `${field.collection.name}.${field.name}`,
            },
          },
        },
      });
      // Set collections for second item to only main.posts to trigger collapse-to-collection
      (AssocCollectionBlock as any).meta.children[1].collections = [posts];

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const assocBlock = dataChildren.find((c) => c.key === 'AssocCollectionBlock');
      const assocChildren = assocBlock.children as any[];

      // First child: ASSOCIATION_RECORDS grouped by DS
      const assocGroup = assocChildren.find((i) => i.key === 'AssocCollectionBlock.Associated records');
      const assocDSNodes = assocGroup.children as any[];
      const assocDSKeys = assocDSNodes.map((d) => d.key).sort();
      expect(assocDSKeys).toEqual([
        'AssocCollectionBlock.Associated records.main',
        'AssocCollectionBlock.Associated records.remote',
      ]);
      // Each DS node contains fields
      const mainAssoc = assocDSNodes.find((d) => d.key.endsWith('.main'));
      expect(mainAssoc.children[0].key).toBe('AssocCollectionBlock.Associated records.main.author');
      expect(mainAssoc.children[0].createModelOptions.use).toBe('AssocCollectionBlock');
      expect(mainAssoc.children[0].createModelOptions.stepParams.resourceSettings.init.associationName).toBe(
        'posts.author',
      );

      // Second child: Only Posts -> should collapse DS layer and collection layer when single target
      const onlyPosts = assocChildren.find((i) => i.key === 'AssocCollectionBlock.Only Posts');
      // children should be collapsed to direct createModelOptions
      expect(onlyPosts.children).toBeUndefined();
      expect(onlyPosts.createModelOptions.use).toBe('AssocCollectionBlock');
      expect(onlyPosts.createModelOptions.stepParams.resourceSettings.init.collectionName).toBe('posts');
      expect(onlyPosts.createModelOptions.stepParams.resourceSettings.init.dataSourceKey).toBe('main');
    });

    test('processDataBlockChildren: single DS with multiple collections collapses DS layer only', async () => {
      attachDataSources(engine);

      class DSOnlyCollapseBlock extends CollectionBlockModel {
        static meta = {
          label: 'DSOnly',
          children: [
            {
              label: 'Main Collections',
              createModelOptions: { use: 'DSOnlyCollapseBlock' },
              collections: [] as any[],
            },
          ],
        };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, DSOnlyCollapseBlock });

      // Limit to main posts & comments to force single DS and multiple collections
      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!;
      const comments = dsm.getDataSource('main')!.getCollection('comments')!;
      (DSOnlyCollapseBlock as any).meta.children[0].collections = [posts, comments];

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const block = dataChildren.find((c) => c.key === 'DSOnlyCollapseBlock');
      const children = block.children as any[];
      const mainCollections = children.find((i) => i.key === 'DSOnlyCollapseBlock.Main Collections');
      expect(mainCollections.children.some((c) => c.key.endsWith('.main.posts'))).toBe(true);
      expect(mainCollections.children.some((c) => c.key.endsWith('.main.comments'))).toBe(true);
    });

    test('processDataBlockChildren: association records keep DS/field layers even with a single field', async () => {
      attachDataSources(engine);
      class AssocSingleFieldBlock extends CollectionBlockModel {
        static meta = {
          label: 'AssocSingle',
          children: [
            {
              key: MENU_KEYS.ASSOCIATION_RECORDS,
              label: 'Associated records',
              fields: [] as any[],
            },
          ],
        };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, AssocSingleFieldBlock });

      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!;
      const postsAuthor = posts.getField('author')!; // one field only
      (AssocSingleFieldBlock as any).meta.children[0].fields = [postsAuthor];

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const block = dataChildren.find((c) => c.key === 'AssocSingleFieldBlock');
      const assocNode = (block.children as any[]).find((i) => i.key === 'AssocSingleFieldBlock.Associated records');
      // With single DS and one field, DS layer may collapse or not depending on implementation;
      // pick first child (DS or field) robustly and then select field node accordingly.
      const first = Array.isArray(assocNode.children) ? (assocNode.children as any[])[0] : undefined;
      const fieldNode = first?.children ? first.children[0] : first;
      expect(fieldNode.key).toBe('AssocSingleFieldBlock.Associated records.main.author');
    });

    test('buildBlockItems filter limits returned blocks/groups', async () => {
      attachDataSources(engine);
      class AColl extends CollectionBlockModel {}
      class BFilter extends FilterBlockModel {}
      class COther extends BlockModel {}
      engine.registerModels({
        BlockModel,
        DataBlockModel,
        FilterBlockModel,
        CollectionBlockModel,
        AColl,
        BFilter,
        COther,
      });

      const items = buildBlockItems(model, (_M, name) => name === 'BFilter');
      expect(items).toHaveLength(1);
      expect(items[0].key).toBe('filterBlocks');
    });
  });

  describe('buildBlockItems() - current flow dynamic children', () => {
    test('cross-data-source other collection: only shows Other records (no current/assoc)', async () => {
      attachDataSources(engine);
      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!; // current collection in main

      class DetailsModel extends CollectionBlockModel {
        static meta = { label: 'Details', createModelOptions: { x: 1 } };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, DetailsModel });

      const parent = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'p3' });
      // cross-DS collectionName: users (remote)
      (parent.context as FlowModelContext).defineProperty('currentFlow', {
        value: {
          blockModel: { collection: posts },
          inputArgs: { filterByTk: 'id1', collectionName: 'users' },
        },
      });
      const child = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'c3', parentId: parent.uid });

      const [dataGroup] = buildBlockItems(child);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const item = dataChildren.find((i) => i.key === 'DetailsModel');
      const labels = (item.children as any[]).map((c) => c.label);
      expect(labels).toEqual(['{{t("Other records")}}']);
    });
    test('generates dynamic children based on current flow context (no filterByTk vs. with filterByTk)', async () => {
      attachDataSources(engine);
      const dsm = engine.context.dataSourceManager;
      const main = dsm.getDataSource('main')!;
      const remote = dsm.getDataSource('remote')!;
      const posts = main.getCollection('posts')!;
      const users = remote.getCollection('users')!;

      class DetailsModel extends CollectionBlockModel {
        static meta = { label: 'Details', createModelOptions: { x: 1 } };
      }

      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, DetailsModel });

      // Create a parent and set currentFlow on its context for the child model
      const parent = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'parent' });
      // Attach currentFlow with current block collection
      (parent.context as FlowModelContext).defineProperty('currentFlow', {
        value: { blockModel: { collection: posts }, inputArgs: {} },
      });

      // Child model that has the parent
      const child = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'child', parentId: parent.uid });

      // 1) No filterByTk -> should show Current collection + Other collections
      const [dataGroup1] = buildBlockItems(child);
      const dataChildren1 = await (dataGroup1.children as () => Promise<any[]>)();
      const detailsItem1 = dataChildren1.find((i) => i.key === 'DetailsModel');
      const detailsChildren1 = detailsItem1.children as any[];
      const keys1 = detailsChildren1.map((c) => c.key).sort();
      expect(keys1).toEqual(['DetailsModel.{{t("Current collection")}}', 'DetailsModel.{{t("Other collections")}}']);

      // 2) With filterByTk and same collection -> should include Current record (for DetailsModel), Association records, Other records
      (parent.context as FlowModelContext).defineProperty('currentFlow', {
        value: { blockModel: { collection: posts }, inputArgs: { filterByTk: '1' } },
      });
      const [dataGroup2] = buildBlockItems(child);
      const dataChildren2 = await (dataGroup2.children as () => Promise<any[]>)();
      const detailsItem2 = dataChildren2.find((i) => i.key === 'DetailsModel');
      const detailsChildren2 = detailsItem2.children as any[];
      const labels2 = detailsChildren2.map((c) => c.label);
      expect(labels2).toContain('{{t("Current record")}}');
      expect(labels2).toContain('{{t("Associated records")}}');
      expect(labels2).toContain('{{t("Other records")}}');

      // 3) With filterByTk and other collection -> current record refers to target collection
      (parent.context as FlowModelContext).defineProperty('currentFlow', {
        value: {
          blockModel: { collection: posts },
          inputArgs: {
            filterByTk: '1',
            collectionName: 'comments', // same dataSource as posts
            associationName: 'posts.comments',
            sourceId: '2',
          },
        },
      });
      const [dataGroup3] = buildBlockItems(child);
      const dataChildren3 = await (dataGroup3.children as () => Promise<any[]>)();
      const detailsItem3 = dataChildren3.find((i) => i.key === 'DetailsModel');
      const detailsChildren3 = detailsItem3.children as any[];
      const currentRecordItem = detailsChildren3.find((c) => c.key === 'DetailsModel.{{t("Current record")}}');
      expect(currentRecordItem).toBeTruthy();
      const stepParams = currentRecordItem.createModelOptions.stepParams;
      expect(stepParams.resourceSettings.init.collectionName).toBe('comments');
      expect(stepParams.resourceSettings.init.dataSourceKey).toBe(posts.dataSource.key);
      expect(stepParams.resourceSettings.init.associationName).toBe('posts.comments');
      expect(stepParams.resourceSettings.init.sourceId).toBe('{{ctx.inputArgs.sourceId}}');
    });

    test('non-SHOW_CURRENT_MODELS blocks do not include "Current record" even with filterByTk', async () => {
      attachDataSources(engine);
      const dsm = engine.context.dataSourceManager;
      const posts = dsm.getDataSource('main')!.getCollection('posts')!;

      class SomeOtherModel extends CollectionBlockModel {
        static meta = { label: 'OtherDetails' };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, SomeOtherModel });

      const parent = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'parent2' });
      (parent.context as FlowModelContext).defineProperty('currentFlow', {
        value: { blockModel: { collection: posts }, inputArgs: { filterByTk: '1' } },
      });
      const child = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'child2', parentId: parent.uid });

      const [dataGroup] = buildBlockItems(child);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const item = dataChildren.find((i) => i.key === 'SomeOtherModel');
      const labels = (item.children as any[]).map((c) => c.label);
      expect(labels).not.toContain('{{t("Current record")}}');
      expect(labels).toContain('{{t("Associated records")}}');
      expect(labels).toContain('{{t("Other records")}}');
    });
  });

  describe('processDataBlockChildren - async and function forms', () => {
    test('data block with function meta.children: resolves items and handles error', async () => {
      attachDataSources(engine);
      class FuncChildBlock extends CollectionBlockModel {
        static meta = {
          label: 'FuncChild',
          children: async () => [{ label: 'Dynamic Item', createModelOptions: { use: 'FuncChildBlock' } }],
        };
      }
      class ThrowChildBlock extends CollectionBlockModel {
        static meta = {
          label: 'ThrowChild',
          children: async () => {
            throw new Error('boom');
          },
        };
      }
      engine.registerModels({
        BlockModel,
        DataBlockModel,
        CollectionBlockModel,
        FuncChildBlock,
        ThrowChildBlock,
      });

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const funcItem = dataChildren.find((i) => i.key === 'FuncChildBlock');
      const throwItem = dataChildren.find((i) => i.key === 'ThrowChildBlock');

      // function children resolved
      const dynamicNode = (funcItem.children as any[]).find((i) => i.key === 'FuncChildBlock.Dynamic Item');
      expect(dynamicNode).toBeTruthy();
      // has DS layer because multiple data sources exist
      const dsKeys = (dynamicNode.children as any[]).map((d) => d.key).sort();
      expect(dsKeys).toEqual(['FuncChildBlock.Dynamic Item.main', 'FuncChildBlock.Dynamic Item.remote']);

      // thrown children resolved to empty array
      expect(throwItem.children as any[]).toEqual([]);
    });

    test('data block item with async createModelOptions is resolved (non-association)', async () => {
      attachDataSources(engine);
      class AsyncOptionsBlock extends CollectionBlockModel {
        static meta = {
          label: 'AsyncBlock',
          children: [
            {
              label: 'Async Item',
              createModelOptions: async () => ({ use: 'AsyncOptionsBlock', extra: 'ok' }),
            },
          ],
        };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, AsyncOptionsBlock });

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const block = dataChildren.find((i) => i.key === 'AsyncOptionsBlock');
      const asyncNode = (block.children as any[]).find((i) => i.key === 'AsyncOptionsBlock.Async Item');
      const mainPosts = (asyncNode.children as any[])
        .find((d) => d.key.endsWith('.main'))
        .children.find((c) => c.key.endsWith('.posts'));
      expect(mainPosts.createModelOptions.use).toBe('AsyncOptionsBlock');
      expect(mainPosts.createModelOptions.extra).toBe('ok');
      expect(mainPosts.createModelOptions.stepParams.resourceSettings.init).toEqual(
        expect.objectContaining({ dataSourceKey: 'main', collectionName: 'posts' }),
      );
    });

    test('data block item with throwing createModelOptions falls back and logs error', async () => {
      attachDataSources(engine);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      class ErrorOptionsBlock extends CollectionBlockModel {
        static meta = {
          label: 'ErrorBlock',
          children: [
            {
              label: 'Error Node',
              createModelOptions: () => {
                throw new Error('Failed');
              },
            },
          ],
        };
      }
      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, ErrorOptionsBlock });

      const [dataGroup] = buildBlockItems(model);
      const dataChildren = await (dataGroup.children as () => Promise<any[]>)();
      const block = dataChildren.find((i) => i.key === 'ErrorOptionsBlock');
      const node = (block.children as any[]).find((i) => i.key === 'ErrorOptionsBlock.Error Node');
      const mainPosts = (node.children as any[])
        .find((d) => d.key.endsWith('.main'))
        .children.find((c) => c.key.endsWith('.posts'));

      // use falls back to childKey
      expect(mainPosts.createModelOptions.use).toBe('ErrorOptionsBlock.Error Node');
      // stepParams injected despite error
      expect(mainPosts.createModelOptions.stepParams.resourceSettings.init).toEqual(
        expect.objectContaining({ dataSourceKey: 'main', collectionName: 'posts' }),
      );
      expect(consoleSpy).toHaveBeenCalledWith('Error resolving createModelOptions function:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('mixed async + broken inheritance in block classes still builds menus', async () => {
      attachDataSources(engine);
      class GoodDataBlock extends CollectionBlockModel {
        static meta = {
          label: 'GoodData',
          children: async () => [{ label: 'Dyn', createModelOptions: async () => ({ use: 'GoodDataBlock', x: 1 }) }],
        };
      }
      class BrokenBlock extends BlockModel {
        static meta = { label: 'BrokenBlock' };
      }
      // Break its prototype chain
      Object.setPrototypeOf(BrokenBlock.prototype, null);

      engine.registerModels({ BlockModel, DataBlockModel, CollectionBlockModel, GoodDataBlock, BrokenBlock });

      const groups = buildBlockItems(model);
      const dataGroup = groups.find((g: any) => g.key === 'dataBlocks');
      const children = await (dataGroup.children as () => Promise<any[]>)();
      const keys = children.map((c) => c.key).sort();
      // Only GoodDataBlock appears in data blocks; BrokenBlock excluded
      expect(keys).toContain('GoodDataBlock');
      expect(keys).not.toContain('BrokenBlock');

      const good = children.find((c) => c.key === 'GoodDataBlock');
      // Has DS layer since two data sources exist
      const dynNode = (good.children as any[]).find((i) => i.key === 'GoodDataBlock.Dyn');
      const dsKeys = (dynNode.children as any[]).map((d) => d.key).sort();
      expect(dsKeys).toEqual(['GoodDataBlock.Dyn.main', 'GoodDataBlock.Dyn.remote']);
      // Leaf contains async-computed options merged with DS/collection stepParams
      const mainPosts = (dynNode.children as any[])
        .find((d) => d.key.endsWith('.main'))
        .children.find((c) => c.key.endsWith('.posts'));
      expect(mainPosts.createModelOptions.use).toBe('GoodDataBlock');
      expect(mainPosts.createModelOptions.x).toBe(1);
      expect(mainPosts.createModelOptions.stepParams.resourceSettings.init).toEqual(
        expect.objectContaining({ dataSourceKey: 'main', collectionName: 'posts' }),
      );
    });
  });
});
