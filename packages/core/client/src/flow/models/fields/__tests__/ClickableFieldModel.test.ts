/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClickableFieldModel } from '../ClickableFieldModel';
import { DisplayTitleFieldModel } from '../DisplayTitleFieldModel';
import { DisplayTextFieldModel } from '../DisplayTextFieldModel';

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

  it('uses the parent association field when the display model is bound to the title field', () => {
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
    const titleField = {
      name: 'title',
      collection: rolesCollection,
      isAssociationField: () => false,
    };

    const parent = engine.createModel<FlowModel>({
      use: FlowModel,
      uid: 'roles-column',
    });
    parent.context.defineProperty('collectionField', { value: rolesField });

    const model = engine.createModel<ClickableFieldModel>({
      use: ClickableFieldModel,
      uid: 'roles-title-display',
    });
    model.setParent(parent);
    model.context.defineProperty('collectionField', { value: titleField });
    model.context.defineProperty('blockModel', { value: { collection: usersCollection } });
    model.context.defineProperty('record', { value: { id: 1 } });
    const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue([]);
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

  it('renders title display values as links when click-to-open is enabled', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayTitleFieldModel });

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
    const titleField = {
      name: 'title',
      collection: rolesCollection,
      isAssociationField: () => false,
    };

    const parent = engine.createModel<FlowModel>({
      use: FlowModel,
      uid: 'roles-title-column',
    });
    parent.context.defineProperty('collectionField', { value: rolesField });

    const model = engine.createModel<DisplayTitleFieldModel>({
      use: DisplayTitleFieldModel,
      uid: 'roles-title-display-link',
      props: {
        clickToOpen: true,
        titleField: 'name',
        value: { name: 'admin', title: 'Admin' },
      },
    });
    model.setParent(parent);
    model.context.defineProperty('collectionField', { value: titleField });
    model.context.defineProperty('blockModel', { value: { collection: usersCollection } });
    model.context.defineProperty('record', { value: { id: 1 } });
    const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue([]);

    render(React.createElement(React.Fragment, null, model.render()));
    const link = screen.getByText('admin').closest('a');
    expect(link).toBeTruthy();

    fireEvent.click(link);

    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      expect.objectContaining({
        filterByTk: 'admin',
        collectionName: 'users',
        associationName: 'users.roles',
        sourceId: 1,
      }),
      { debounce: true },
    );
  });

  it('renders object title field values by configured target title field', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayTextFieldModel });

    const model = engine.createModel<DisplayTextFieldModel>({
      use: DisplayTextFieldModel,
      uid: 'display-text-association-title',
    });
    model.context.defineProperty('collectionField', {
      value: {
        targetCollectionTitleFieldName: 'code',
        isAssociationField: () => true,
      },
    });

    render(model.renderInDisplayStyle({ id: 2, name: 'Sales', code: 'S-001' }, { id: 1 }, false));

    expect(screen.getByText('S-001')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('refreshes the parent column when title display click-to-open changes', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayTitleFieldModel });

    const rolesField = {
      name: 'roles',
      target: 'roles',
      collection: { name: 'users' },
      targetCollection: { name: 'roles' },
      isAssociationField: () => true,
      getComponentProps: () => ({ titleField: 'name' }),
    };
    const titleField = {
      name: 'title',
      collection: { name: 'roles' },
      isAssociationField: () => false,
    };

    const parent = engine.createModel<FlowModel>({
      use: FlowModel,
      uid: 'roles-title-column-refresh',
    });
    parent.context.defineProperty('collectionField', { value: rolesField });
    const parentSetProps = vi.spyOn(parent, 'setProps');
    const parentRerender = vi.spyOn(parent, 'rerender').mockResolvedValue(undefined);

    const model = engine.createModel<DisplayTitleFieldModel>({
      use: DisplayTitleFieldModel,
      uid: 'roles-title-display-refresh',
    });
    model.setParent(parent);
    model.context.defineProperty('collectionField', { value: titleField });
    const modelRerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

    const clickToOpenStep = model.getFlow('displayFieldSettings').steps.clickToOpen;

    await clickToOpenStep.afterParamsSave(model.context as any, { clickToOpen: true }, { clickToOpen: false });

    expect(model.props).toMatchObject({
      clickToOpen: true,
      titleField: 'name',
    });
    expect(modelRerender).toHaveBeenCalled();
    expect(parentSetProps).toHaveBeenCalledWith({
      __displayFieldRefreshKey: expect.any(String),
    });
    expect(parentRerender).toHaveBeenCalled();
  });
});
