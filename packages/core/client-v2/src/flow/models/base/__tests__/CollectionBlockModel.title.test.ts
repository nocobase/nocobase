/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, FlowEngine } from '@nocobase/flow-engine';
import { createDefaultCollectionBlockTitle } from '../../../utils/blockUtils';

function normalizeTitle(s: string) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function setupMainCollections(engine: FlowEngine) {
  const main = engine.dataSourceManager.getDataSource('main');
  // Ensure a simple collection exists
  main.addCollection({ name: 'posts', title: 'Posts' });

  // Ensure association scenario: users.hasMany(tags)
  main.addCollection({ name: 'tags', title: 'Tags' });
  main.addCollection({
    name: 'users',
    title: 'Users',
    fields: [{ name: 'tags', type: 'hasMany', target: 'tags', title: 'Tags' }],
  });
}

describe('CollectionBlockModel default title rule', () => {
  it('hides datasource when only one exists (simple collection)', () => {
    const engine = new FlowEngine();
    setupMainCollections(engine);
    const title = createDefaultCollectionBlockTitle({
      blockLabel: 'Table',
      dsName: 'Main',
      dsCount: engine.dataSourceManager.getDataSources().length,
      collectionTitle: 'Posts',
    });
    const t = normalizeTitle(title);
    expect(t).toContain('Table:');
    expect(t).toContain('Posts');
    expect(t).not.toContain('Main >');
  });

  it('shows datasource when multiple exist (simple collection)', () => {
    const engine = new FlowEngine();
    setupMainCollections(engine);
    engine.dataSourceManager.addDataSource(new DataSource({ key: 'second', displayName: 'Second' }));
    const title = createDefaultCollectionBlockTitle({
      blockLabel: 'Table',
      dsName: 'Main',
      dsCount: engine.dataSourceManager.getDataSources().length,
      collectionTitle: 'Posts',
    });
    const t = normalizeTitle(title);
    expect(t).toContain('Table:');
    expect(t).toContain('Main > Posts');
  });

  it('association: hides datasource when only one exists', () => {
    const engine = new FlowEngine();
    setupMainCollections(engine);
    const title = createDefaultCollectionBlockTitle({
      blockLabel: 'Table',
      dsName: 'Main',
      dsCount: engine.dataSourceManager.getDataSources().length,
      collectionTitle: 'Tags',
      sourceCollectionTitle: 'Users',
      associationTitle: 'Tags',
    });
    const t = normalizeTitle(title);
    expect(t).toContain('Table:');
    expect(t).toContain('Users > Tags (Tags)');
    expect(t).not.toContain('Main >');
  });

  it('association: shows datasource when multiple exist', () => {
    const engine = new FlowEngine();
    setupMainCollections(engine);
    engine.dataSourceManager.addDataSource(new DataSource({ key: 'second', displayName: 'Second' }));
    const title = createDefaultCollectionBlockTitle({
      blockLabel: 'Table',
      dsName: 'Main',
      dsCount: engine.dataSourceManager.getDataSources().length,
      collectionTitle: 'Tags',
      sourceCollectionTitle: 'Users',
      associationTitle: 'Tags',
    });
    const t = normalizeTitle(title);
    expect(t).toContain('Table:');
    expect(t).toContain('Main > Users > Tags (Tags)');
  });
});
