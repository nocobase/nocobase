/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { SingleRecordResource } from '@nocobase/flow-engine';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { FieldModel } from '../../base/FieldModel';
export class AssociationFieldModel extends FieldModel {
  operator = '$eq';
}

AssociationFieldModel.registerFlow({
  key: 'AssociationFieldInit',
  sort: 800,
  steps: {
    init: {
      async handler(ctx, params) {
        if ((ctx.model as any).updateAssociation) {
          const currentBlock = ctx.model.context.blockModel;
          const resource = currentBlock.context.resource as SingleRecordResource;
          resource.addUpdateAssociationValues((ctx.model.parent as FormItemModel).fieldPath);
        }
      },
    },
    allowCreateCheck: {
      async handler(ctx) {
        const aclCreate = await ctx.aclCheck({
          dataSourceKey: ctx.collectionField.dataSourceKey,
          resourceName: ctx.collectionField?.target,
          actionName: 'create',
        });
        ctx.model.setProps({
          allowCreate: !!aclCreate,
        });
      },
    },
  },
});
