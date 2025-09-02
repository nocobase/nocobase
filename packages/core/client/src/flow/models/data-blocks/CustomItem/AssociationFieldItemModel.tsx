/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FlowModel, FlowModelContext, buildWrapperFieldChildren } from '@nocobase/flow-engine';
import { TableModel } from '../table/TableModel';

export class AssociationFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    const itemModel = ctx.model.context.blockModel instanceof TableModel ? 'TableColumnModel' : 'DetailItemModel';

    const getToOneFields = (collection: Collection) => collection.getToOneAssociationFields();

    const buildAssociationFieldChildren = (field, useModel: string, associationPath: string) =>
      buildWrapperFieldChildren(ctx, {
        collection: field.targetCollection,
        useModel: itemModel,
        fieldUseModel: (f) => f.getFirstSubclassNameOf(useModel) || useModel,
        associationPathName: associationPath,
      });

    const processAssociationFields = (fields, level = 1, pathPrefix?: string): any[] =>
      fields.map((field) => {
        const keyBase = `${field.name}-${field.collectionName}-${level}`;
        const associationPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

        const children: any[] = [
          {
            key: `${keyBase}-collectionField`,
            label: 'Display collection fields',
            type: 'group',
            children: buildAssociationFieldChildren(field, 'ReadPrettyFieldModel', associationPath),
          },
        ];

        if (level < 2) {
          const nestedFields = getToOneFields(field.targetCollection);
          if (nestedFields.length) {
            children.push({
              key: `${keyBase}-associationField`,
              label: ctx.t('Display association fields'),
              type: 'group',
              children: processAssociationFields(nestedFields, level + 1, associationPath),
            });
          }
        }

        return {
          key: keyBase,
          label: ctx.t(field.title),
          children,
        };
      });

    const rootFields = getToOneFields(ctx.model.context.blockModel.collection);
    return processAssociationFields(rootFields);
  }
}

AssociationFieldItemModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});
