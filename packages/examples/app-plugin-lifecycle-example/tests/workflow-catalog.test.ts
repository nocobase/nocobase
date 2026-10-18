import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';
import { WorkflowCatalogService } from '../server/services/workflow-catalog.js';
import { migrations, test } from './fixtures.js';

describeMigration('202610160001_lifecycle_example_workflow_catalog', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('lifecycleExampleWorkflowCategories').toExist();
    await expectCollection('lifecycleExampleWorkflowCatalog').toHaveField(
      'categoryId',
      { nullable: true },
    );
  },
});

describe('workflow catalog business metadata', () => {
  test('persists classification and clears it when a category is deleted', async ({
    database,
  }) => {
    const service = new WorkflowCatalogService(database);
    const category = await service.saveCategory({
      title: 'Finance',
      sortOrder: 2,
    });
    await service.assign('example.expenses', category.id);
    await service.assign('example.expenses', null);
    await service.assign('example.expenses', category.id);
    expect((await service.assignments()).get('example.expenses')).toBe(
      category.id,
    );
    await service.saveCategory(
      { title: 'Finance operations', sortOrder: 1, color: 'blue' },
      category.id,
    );
    expect(await service.categories()).toEqual([
      { ...category, title: 'Finance operations', sortOrder: 1, color: 'blue' },
    ]);
    await service.deleteCategory(category.id);
    expect(await service.categories()).toEqual([]);
    expect((await service.assignments()).get('example.expenses')).toBeNull();
    await expect(
      service.assign('example.expenses', category.id),
    ).rejects.toThrow('does not exist');
  });
  test('reorders atomically and refuses an incomplete or duplicate category list', async ({
    database,
  }) => {
    const service = new WorkflowCatalogService(database);
    const first = await service.saveCategory({
      title: 'Finance',
      sortOrder: 0,
    });
    const second = await service.saveCategory({
      title: 'Office',
      sortOrder: 1,
    });
    await service.reorder([second.id, first.id]);
    expect((await service.categories()).map((row) => row.id)).toEqual([
      second.id,
      first.id,
    ]);
    await expect(service.reorder([first.id])).rejects.toThrow(
      'category list changed',
    );
    await expect(service.reorder([first.id, first.id])).rejects.toThrow(
      'category list changed',
    );
    expect((await service.categories()).map((row) => row.id)).toEqual([
      second.id,
      first.id,
    ]);
  });
});

describeMigration('202610160002_workflow_category_color', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('lifecycleExampleWorkflowCategories').toHaveField(
      'color',
      { nullable: false },
    );
  },
});
