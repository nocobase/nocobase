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

vi.mock('../../components/fieldAssignOptions', () => ({
  collectFieldAssignCascaderOptions: vi.fn(() => []),
}));

import { linkageAssignField, setFieldsDefaultValue, subFormLinkageAssignField } from '../linkageRules';

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-linkage-assign-field-options', flowEngine: engine });
  return { model };
}

function renderAction(action: any, model: any) {
  const Comp: any = action?.uiSchema?.value?.['x-component'];
  return render(
    <FlowSettingsContextProvider value={model.context}>
      <Comp value={[]} onChange={() => {}} />
    </FlowSettingsContextProvider>,
  );
}

describe('linkageRules assign actions - field options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
