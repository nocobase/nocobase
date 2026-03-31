/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { set as lodashSet, get as lodashGet, merge as lodashMerge } from 'lodash';
import { FlowEngine } from '@nocobase/flow-engine';
import { FormValueRuntime } from '..';
import { SubTableColumnModel } from '../../../../fields/AssociationFieldModel/SubTableFieldModel/SubTableColumnModel';

function createFormStub(initialValues: any = {}) {
  const store: any = JSON.parse(JSON.stringify(initialValues || {}));
  return {
    __store: store,
    getFieldValue: (namePath: any) => lodashGet(store, namePath),
    setFieldValue: (namePath: any, value: any) => lodashSet(store, namePath, value),
    getFieldsValue: () => JSON.parse(JSON.stringify(store)),
    setFieldsValue: (patch: any) => lodashMerge(store, patch),
  };
}

describe('SubTableColumnModel (nested subform)', () => {
  it('injects full fieldIndex chain so nested to-many assign rule can write', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubTableColumnModel });

    const formStub = createFormStub({
      users: [{ roles: [{}, {}] }],
    });

    const blockModel: any = engine.createModel({
      use: 'FlowModel',
      uid: 'form-subtable-nested',
      structure: {} as any,
    });
    blockModel.getAclActionName = () => 'create';

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    // Provide collection metadata for item chain & to-many index checks.
    const rolesCollection: any = { getField: () => null };
    const rolesField: any = { isAssociationField: () => true, type: 'hasMany', targetCollection: rolesCollection };
    const usersItemCollection: any = { getField: (name: string) => (name === 'roles' ? rolesField : null) };
    const usersField: any = { isAssociationField: () => true, type: 'hasMany', targetCollection: usersItemCollection };
    const rootCollection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockModel.context.defineProperty('collection', { value: rootCollection });

    // Simulate SubTableColumnModel under a SubTableFieldModel whose association field name is "roles".
    const parentModel: any = engine.createModel({ use: 'FlowModel', uid: 'users.roles', structure: {} as any });
    parentModel.context.defineProperty('collectionField', { value: { name: 'roles' } });

    const column: any = engine.createModel({
      use: 'SubTableColumnModel',
      uid: 'users.roles.name',
      stepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'users.roles.name',
          },
        },
      },
      structure: {} as any,
    });
    column.setParent(parentModel);
    column.context.defineProperty('blockModel', { value: blockModel });
    column.subModels = { field: [] };

    // Render once to create the row fork with parentFieldIndex passed from nested subform row.
    const renderCell = column.renderItem();
    renderCell({
      id: 'cell-1',
      value: undefined,
      rowIdx: 1,
      record: {},
      parentFieldIndex: ['users:0'],
    });

    const rowFork = column.getFork('row:users:0:1');
    expect(rowFork?.context?.fieldIndex).toEqual(['users:0', 'roles:1']);

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.roles.name',
        mode: 'assign',
        value: 'X',
      },
    ]);

    engine.emitter.emit('model:mounted', { model: rowFork });

    await waitFor(() => expect(formStub.getFieldValue(['users', 0, 'roles', 1, 'name'])).toBe('X'));
  });
});
