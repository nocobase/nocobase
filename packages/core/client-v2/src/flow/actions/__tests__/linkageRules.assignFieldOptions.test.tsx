/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FlowEngine, FlowModel, FlowSettingsContextProvider } from '@nocobase/flow-engine';
import { collectFieldAssignCascaderOptions } from '../../components/fieldAssignOptions';

const { mockConditionBuilder } = vi.hoisted(() => ({
  mockConditionBuilder: vi.fn(),
}));

vi.mock('../../components/fieldAssignOptions', () => ({
  buildFieldAssignCascaderOptionsFromCollection: vi.fn(() => []),
  collectFieldAssignCascaderOptions: vi.fn(() => []),
}));

vi.mock('../../components/ConditionBuilder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components/ConditionBuilder')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    ConditionBuilder: (props: any) => {
      mockConditionBuilder(props);
      return ReactModule.createElement('div', { 'data-testid': 'mock-condition-builder' });
    },
  };
});

import {
  linkageAssignField,
  linkageSetDetailsFieldState,
  linkageSetFieldState,
  setFieldsDefaultValue,
  subFormLinkageAssignField,
  subFormLinkageSetFieldState,
} from '../linkageRules';

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-linkage-assign-field-options', flowEngine: engine });
  return { model };
}

function renderAction(action: any, model: any, value: any[] = []) {
  const Comp: any = action?.uiSchema?.value?.['x-component'];
  return render(
    <FlowSettingsContextProvider value={model.context}>
      <Comp value={value} onChange={() => {}} />
    </FlowSettingsContextProvider>,
  );
}

describe('linkageRules assign actions - field options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConditionBuilder.mockClear();
  });

  it('uses maxFormItemDepth=1 for assign actions', () => {
    const { model } = createModel();

    renderAction(linkageAssignField as any, model);
    renderAction(subFormLinkageAssignField as any, model);
    renderAction(setFieldsDefaultValue as any, model);

    expect(collectFieldAssignCascaderOptions).toHaveBeenCalledTimes(3);
    for (const [args] of (collectFieldAssignCascaderOptions as any).mock.calls) {
      expect(args).toMatchObject({
        maxFormItemDepth: 1,
      });
    }
  });

  it('uses field assignment cascader options for per-field state actions', () => {
    const { model } = createModel();

    renderAction(linkageSetFieldState as any, model);
    renderAction(subFormLinkageSetFieldState as any, model);
    renderAction(linkageSetDetailsFieldState as any, model);

    expect(collectFieldAssignCascaderOptions).toHaveBeenCalledTimes(3);
    for (const [args] of (collectFieldAssignCascaderOptions as any).mock.calls) {
      expect(args).toMatchObject({
        maxFormItemDepth: 1,
      });
    }
  });

  it('provides current item condition metadata for relation field state targets', async () => {
    const { model } = createModel();
    const roleNameField: any = {
      name: 'roleName',
      title: 'Role name',
      type: 'string',
      interface: 'input',
    };
    const rolesCollection: any = {
      getFields: () => [roleNameField],
      getField: (name: string) => (name === 'roleName' ? roleNameField : null),
    };
    const rolesField: any = {
      name: 'roles',
      title: 'Roles',
      type: 'hasMany',
      interface: 'o2m',
      targetCollection: rolesCollection,
      isAssociationField: () => true,
    };
    const rootCollection: any = {
      getFields: () => [rolesField],
      getField: (name: string) => (name === 'roles' ? rolesField : null),
    };
    (model as any).collection = rootCollection;

    renderAction(linkageSetFieldState as any, model, [
      {
        key: 'state-1',
        enable: true,
        targetPath: 'roles.roleName',
        state: 'disabled',
        condition: { logic: '$and', items: [] },
      },
    ]);

    expect(mockConditionBuilder).toHaveBeenCalled();
    const conditionProps = mockConditionBuilder.mock.calls[mockConditionBuilder.mock.calls.length - 1]?.[0];
    const extraMetaTree = conditionProps?.extraMetaTree;
    expect(Array.isArray(extraMetaTree)).toBe(true);

    const itemNode = extraMetaTree.find((node: any) => node.name === 'item');
    expect(itemNode?.paths).toEqual(['item']);
    const itemChildren = Array.isArray(itemNode?.children) ? itemNode.children : [];
    expect(itemChildren.some((node: any) => node.name === 'index')).toBe(true);
    const valueNode = itemChildren.find((node: any) => node.name === 'value');
    expect(valueNode?.paths).toEqual(['item', 'value']);
    const attributeChildren = await valueNode.children();
    expect(attributeChildren.some((node: any) => node.name === 'roleName')).toBe(true);
  });
});
