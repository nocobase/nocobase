/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { ClickableFieldModel } from '../ClickableFieldModel';

function createRolesFieldModel(sourceRecord: Record<string, any>) {
  const engine = new FlowEngine();
  engine.registerModels({ ClickableFieldModel });

  const usersCollection = {
    name: 'users',
    filterTargetKey: 'id',
  };
  const rolesCollection = {
    name: 'roles',
    filterTargetKey: 'name',
  };
  const rolesField = {
    name: 'roles',
    target: 'roles',
    targetKey: 'name',
    type: 'belongsToMany',
    interface: 'm2m',
    collection: usersCollection,
    targetCollection: rolesCollection,
    isAssociationField: () => true,
  };

  const model = engine.createModel<ClickableFieldModel>({
    use: ClickableFieldModel,
    uid: `clickable-roles-${sourceRecord?.id ?? 'new'}`,
  });
  model.context.defineProperty('collectionField', { value: rolesField });
  model.context.defineProperty('blockModel', { value: { collection: usersCollection } });
  model.context.defineProperty('record', { value: sourceRecord });

  const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue([]);
  return { model, dispatchEvent };
}

describe('ClickableFieldModel', () => {
  it('opens an association display value as a normal target record when source record has no id', () => {
    const { model, dispatchEvent } = createRolesFieldModel({});
    const event = { type: 'click' };

    model.onClick(event, { name: 'admin', title: 'Admin' });

    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        event,
        filterByTk: 'admin',
        collectionName: 'roles',
        associationName: null,
        sourceId: null,
      },
      { debounce: true },
    );
  });

  it('keeps using the association resource when the source record has an id', () => {
    const { model, dispatchEvent } = createRolesFieldModel({ id: 1 });
    const event = { type: 'click' };

    model.onClick(event, { name: 'admin', title: 'Admin' });

    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        event,
        filterByTk: 'admin',
        collectionName: 'users',
        associationName: 'users.roles',
        sourceId: 1,
      },
      { debounce: true },
    );
  });
});
