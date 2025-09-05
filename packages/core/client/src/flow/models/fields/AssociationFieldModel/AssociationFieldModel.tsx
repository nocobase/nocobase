/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { SingleRecordResource } from '@nocobase/flow-engine';
import { FormFieldModel } from '../FormFieldModel';
import { FormItemModel } from '../../data-blocks/form/FormItem/FormItemModel';
export class AssociationFieldModel extends FormFieldModel {
  public static readonly supportedFieldInterfaces = null;
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
  },
});
