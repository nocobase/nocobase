/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
// Prime the model module graph: the association field models sit in an import cycle that only resolves cleanly when the
// models barrel is loaded first.
import '../../../models';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { CascadeSelectFieldModel } from '../../../models/fields/AssociationFieldModel/CascadeSelectFieldModel';
import { RecordSelectFieldModel } from '../../../models/fields/AssociationFieldModel/RecordSelectFieldModel';
import { SelectFieldModel } from '../../../models/fields/SelectFieldModel';
import {
  createQuickEditDataScopeContext,
  findDataScopeStep,
  getQuickEditDataScopeFilter,
  isEmptyDataScopeFilter,
} from '../quickEditDataScope';

const resolveSubTree = async (subTree: unknown) => {
  if (typeof subTree === 'function') {
    return (await (subTree as () => Promise<Array<{ name: string }>>)()) || [];
  }
  return (subTree as Array<{ name: string }>) || [];
};

describe('quickEditDataScope', () => {
  describe('findDataScopeStep', () => {
    it('finds the data scope step of the dropdown association editor', () => {
      expect(findDataScopeStep(RecordSelectFieldModel)).toEqual({ flowKey: 'selectSettings', stepKey: 'dataScope' });
    });

    it('finds the data scope step of the cascade association editor', () => {
      expect(findDataScopeStep(CascadeSelectFieldModel)).toEqual({ flowKey: 'selectSettings', stepKey: 'dataScope' });
    });

    it('returns null for editors without a data scope step', () => {
      expect(findDataScopeStep(SelectFieldModel)).toBeNull();
    });

    it('returns null for a missing model class', () => {
      expect(findDataScopeStep(undefined)).toBeNull();
    });
  });

  describe('isEmptyDataScopeFilter', () => {
    it('treats a filter without conditions as empty', () => {
      expect(isEmptyDataScopeFilter(undefined)).toBe(true);
      expect(isEmptyDataScopeFilter({ logic: '$and', items: [] })).toBe(true);
    });

    it('treats a filter with conditions as non-empty', () => {
      expect(isEmptyDataScopeFilter({ logic: '$and', items: [{ path: 'name', operator: 'eq', value: 'a' }] })).toBe(
        false,
      );
    });
  });

  describe('getQuickEditDataScopeFilter', () => {
    let engine: FlowEngine;
    let column: FlowModel;
    let displayField: FlowModel;

    beforeEach(() => {
      engine = new FlowEngine();
      column = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'table-column' });
      displayField = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'display-field', parentId: column.uid });
    });

    it('reads the filter configured on the owning table column', () => {
      const filter = { logic: '$and', items: [{ path: 'status', operator: 'eq', value: 'active' }] };
      column.setStepParams('tableColumnSettings', 'quickEditDataScope', { filter });

      expect(getQuickEditDataScopeFilter(displayField)).toEqual(filter);
    });

    it('ignores an unconfigured filter so no step params are injected', () => {
      column.setStepParams('tableColumnSettings', 'quickEditDataScope', { filter: { logic: '$and', items: [] } });

      expect(getQuickEditDataScopeFilter(displayField)).toBeUndefined();
    });

    it('returns undefined when there is no source field model', () => {
      expect(getQuickEditDataScopeFilter(undefined)).toBeUndefined();
    });
  });

  describe('createQuickEditDataScopeContext', () => {
    let engine: FlowEngine;
    let column: FlowModel;

    beforeEach(() => {
      engine = new FlowEngine();
      const ds = engine.context.dataSourceManager.getDataSource('main');
      ds.addCollection({
        name: 'departments',
        filterTargetKey: 'id',
        titleField: 'name',
        fields: [
          { name: 'id', type: 'integer', interface: 'number' },
          { name: 'name', type: 'string', interface: 'input', uiSchema: { title: 'Name' } },
        ],
      });
      ds.addCollection({
        name: 'members',
        filterTargetKey: 'id',
        fields: [
          { name: 'id', type: 'integer', interface: 'number' },
          { name: 'level', type: 'string', interface: 'input', uiSchema: { title: 'Level' } },
          {
            name: 'department',
            type: 'belongsTo',
            interface: 'm2o',
            target: 'departments',
            targetKey: 'id',
            uiSchema: { title: 'Department' },
          },
        ],
      });
      const membersCollection = engine.context.dataSourceManager.getCollection('main', 'members');
      column = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'scoped-column' });
      column.context.defineProperty('collection', { get: () => membersCollection });
      column.context.defineProperty('collectionField', { get: () => membersCollection.getField('department') });
    });

    it('points the left-hand field list at the association target', async () => {
      const scoped = await createQuickEditDataScopeContext(column);

      expect(scoped.collection?.name).toBe('departments');
    });

    it('offers the edited row as a right-hand variable that the column context alone does not provide', async () => {
      // Regression guard: the right-hand tree used to come from the settings view context, which delegates to the
      // column and therefore carries no row record, so "Current record" was missing from the variable picker.
      const columnTree = column.context.getPropertyMetaTree();
      expect(columnTree.find((node) => node.name === 'record')).toBeUndefined();

      const scoped = await createQuickEditDataScopeContext(column);
      const scopedTree = scoped.getPropertyMetaTree();

      expect(scopedTree.find((node) => node.name === 'record')).toBeDefined();
    });

    it('keeps the row record describing the table collection rather than the association target', async () => {
      const scoped = await createQuickEditDataScopeContext(column);
      const recordSubTree = await resolveSubTree(scoped.getPropertyMetaTree('{{ ctx.record }}'));

      expect(recordSubTree.map((node) => node.name)).toContain('level');
    });
  });
});
