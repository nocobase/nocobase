/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { VariableFilterItem } from '../VariableFilterItem';
import { createMockFlowApp, TestCollectionFieldInterface } from '../../../__tests__/helpers/mockFlowApp';

const captured = vi.hoisted(() => ({ metaTrees: [] as any[] }));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const MockVariableInput = ({ onChange, metaTree }: any) => {
    if (metaTree) {
      captured.metaTrees.push(metaTree);
    }
    return (
      <button
        type="button"
        data-testid="variable-input"
        onClick={() =>
          onChange?.('title', {
            interface: 'input',
            uiSchema: { 'x-component': 'Input' },
            paths: ['collection', 'title'],
          })
        }
      >
        mock-variable-input
      </button>
    );
  };
  return { ...actual, VariableInput: MockVariableInput };
});

// $context.data (not an association) -> category (m2o) -> book (m2o) -> createdBy (not counted) -> departments (m2m).
// Mirrors a workflow collection-event trigger that preloads `category.book.createdBy.departments`.
function buildRightMetaTree(): MetaTreeNode[] {
  const departments: MetaTreeNode = {
    name: 'departments',
    title: 'Departments',
    type: 'object',
    interface: 'm2m',
    paths: ['$context', 'data', 'category', 'book', 'createdBy', 'departments'],
  };
  const createdBy: MetaTreeNode = {
    name: 'createdBy',
    title: 'Created by',
    type: 'object',
    interface: 'createdBy',
    paths: ['$context', 'data', 'category', 'book', 'createdBy'],
    children: async () => [departments],
  };
  const book: MetaTreeNode = {
    name: 'book',
    title: 'Book',
    type: 'object',
    interface: 'obo',
    paths: ['$context', 'data', 'category', 'book'],
    children: async () => [createdBy],
  };
  const category: MetaTreeNode = {
    name: 'category',
    title: 'Category',
    type: 'object',
    interface: 'm2o',
    paths: ['$context', 'data', 'category'],
    children: async () => [book],
  };
  const data: MetaTreeNode = {
    name: 'data',
    title: 'Trigger data',
    type: 'object',
    paths: ['$context', 'data'],
    children: async () => [category],
  };
  return [{ name: '$context', title: 'Trigger variables', type: '', paths: ['$context'], children: [data] }];
}

async function resolveChildren(node: MetaTreeNode | undefined) {
  const children = node?.children;
  if (typeof children === 'function') {
    return (await (children as () => Promise<MetaTreeNode[]>)()) ?? [];
  }
  return Array.isArray(children) ? children : [];
}

async function walkToCreatedByChildren(metaTree: any) {
  const roots: MetaTreeNode[] = typeof metaTree === 'function' ? await metaTree() : metaTree;
  const context = roots.find((node) => node.name === '$context');
  const data = (await resolveChildren(context)).find((node) => node.name === 'data');
  const category = (await resolveChildren(data)).find((node) => node.name === 'category');
  const book = (await resolveChildren(category)).find((node) => node.name === 'book');
  const createdBy = (await resolveChildren(book)).find((node) => node.name === 'createdBy');
  return (await resolveChildren(createdBy)).map((node) => node.name);
}

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-variable-filter-right', flowEngine: engine });
  const app = createMockFlowApp();
  model.context.defineProperty('app', { value: app });

  class InputInterface extends TestCollectionFieldInterface {
    name = 'input';
    group = 'basic';
    filterable = { operators: [{ value: '$eq', label: 'Equals' }] };
  }
  app.addFieldInterfaces([InputInterface]);

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    fields: [{ name: 'title', type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } }],
  });
  model.context.defineProperty('collection', { get: () => ds.getCollection('posts') });

  return model as any;
}

function renderItem(props: Record<string, unknown>) {
  const value = { path: 'title', operator: '$eq', value: '' } as any;
  const model = createModel();
  render(
    <VariableFilterItem value={value} model={model} rightAsVariable rightMetaTree={buildRightMetaTree()} {...props} />,
  );
  fireEvent.click(screen.getAllByTestId('variable-input')[0]);
  return captured.metaTrees.at(-1);
}

describe('VariableFilterItem right-side association depth', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    captured.metaTrees = [];
  });

  it('applies maxAssociationFieldDepth to the right tree by default', async () => {
    const metaTree = renderItem({ maxAssociationFieldDepth: 2 });
    // `departments` is the third association down the path, so the default cap removes it.
    expect(await walkToCreatedByChildren(metaTree)).toEqual([]);
  });

  // The right side is a variable tree whose depth is decided by its provider (in workflow, by the trigger's
  // "Preload associations" config). Capping it by the left-side field-picker limit hid preloaded variables.
  it('leaves the right tree untouched when rightMaxAssociationFieldDepth is null', async () => {
    const metaTree = renderItem({ maxAssociationFieldDepth: 2, rightMaxAssociationFieldDepth: null });
    expect(await walkToCreatedByChildren(metaTree)).toEqual(['departments']);
  });
});
