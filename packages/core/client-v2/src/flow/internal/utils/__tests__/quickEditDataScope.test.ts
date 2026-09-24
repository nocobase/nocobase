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
import { findDataScopeStep, getQuickEditDataScopeFilter, isEmptyDataScopeFilter } from '../quickEditDataScope';

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
});
