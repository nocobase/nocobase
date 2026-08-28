/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { AssociationFieldModel } from '../AssociationFieldModel';

class DefaultAssociationFieldModel extends AssociationFieldModel {}

class UpdateAssociationFieldModel extends AssociationFieldModel {
  updateAssociation = true;
}

async function runAssociationFieldInit(FieldModelClass: typeof AssociationFieldModel) {
  const engine = new FlowEngine();
  engine.registerModels({
    DefaultAssociationFieldModel,
    UpdateAssociationFieldModel,
  });

  const addUpdateAssociationValues = vi.fn();
  const blockModel = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'form-block',
  });
  blockModel.context.defineProperty('resource', {
    value: { addUpdateAssociationValues },
  });

  const formItem = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid: 'form-item',
  });
  (formItem as FlowModel & { fieldPath: string }).fieldPath = 'author';
  formItem.context.defineProperty('blockModel', { value: blockModel });

  const field = engine.createModel<AssociationFieldModel>({
    use: FieldModelClass,
    uid: 'association-field',
    parentId: formItem.uid,
  });
  field.context.defineProperty('collectionField', {
    value: {
      dataSourceKey: 'main',
      target: 'users',
    },
  });

  await field.applyFlow('AssociationFieldInit');

  return addUpdateAssociationValues;
}

describe('AssociationFieldModel updateAssociation', () => {
  it('does not add updateAssociationValues by default', async () => {
    const addUpdateAssociationValues = await runAssociationFieldInit(DefaultAssociationFieldModel);

    expect(addUpdateAssociationValues).not.toHaveBeenCalled();
  });

  it('adds updateAssociationValues for opt-in association fields', async () => {
    const addUpdateAssociationValues = await runAssociationFieldInit(UpdateAssociationFieldModel);

    expect(addUpdateAssociationValues).toHaveBeenCalledWith('author');
  });
});
