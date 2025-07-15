/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { escapeT } from '@nocobase/flow-engine';

import { EditableFieldModel } from '../EditableFieldModel';

export class EditableAssociationFieldModel extends EditableFieldModel {
  public static readonly supportedFieldInterfaces = null;
}

EditableAssociationFieldModel.registerFlow({
  auto: true,
  key: 'AssociationFieldSetting',
  steps: {
    fieldModel: {
      title: escapeT('Set field model'),
      uiSchema: (ctx) => {
        const data = ctx.model.collectionField.getSubclassesOf('EditableFieldModel');
        const options = Array.from(data.keys()).map((v) => {
          return {
            value: v,
            label: v,
          };
        });
        return {
          fieldModel: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: options,
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          fieldModel: ctx.model.collectionField.getFirstSubclassNameOf('EditableFieldModel'),
        };
      },
      handler: (ctx, params) => {
        // ctx.model.parent.setSubModel('items', {
        //   use: params.fieldModel,
        //   stepParams: {
        //     fieldSettings: {
        //       init: {
        //         dataSourceKey: ctx.model.collectionField.dataSourceKey,
        //         collectionName: ctx.model.collectionField.collection.name,
        //         fieldPath: ctx.model.fieldPath,
        //       },
        //     },
        //   },
        // });
      },
    },
  },
});
