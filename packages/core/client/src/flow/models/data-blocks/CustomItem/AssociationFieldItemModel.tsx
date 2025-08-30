/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel, FlowModelContext, buildWrapperFieldChildren } from '@nocobase/flow-engine';

export class AssociationFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    const filterToOneAssociationFields = (collection) => {
      return collection.getFields().filter((field) => ['oho', 'obo', 'm2o'].includes(field.interface));
    };

    const buildAssociationFieldChildren = (field, useModel: string) => {
      return buildWrapperFieldChildren(ctx, {
        collection: field.targetCollection,
        useModel: 'DetailItemModel',
        fieldUseModel: (f) => f.getFirstSubclassNameOf(useModel) || useModel,
        associationName: field.name,
      });
    };

    const processAssociationFields = (fields, level = 1) => {
      return fields.map((field) => {
        const key = `${field.name}-${field.collectionName}-${level}`;

        const child: any[] = [];

        child.push({
          key: `${key}-collectionField`,
          label: '',
          type: 'group',
          children: buildAssociationFieldChildren(field, 'ReadPrettyFieldModel'),
        });

        if (level < 2) {
          const targetAssociationFields = filterToOneAssociationFields(field.targetCollection);

          if (targetAssociationFields.length > 0) {
            const associationChildren = processAssociationFields(targetAssociationFields, level + 1); // Recursion to next level

            child.push({
              key: `${key}-associationField`,
              label: ctx.t('Display association fields'),
              type: 'group',
              children: associationChildren,
            });
          }
        }

        return {
          key,
          label: ctx.t(field.title),
          children: child,
        };
      });
    };

    // Start by processing the first level of fields
    const toOneAssociationFields = filterToOneAssociationFields(ctx.model.context.blockModel.collection);
    return processAssociationFields(toOneAssociationFields);
  }
}

AssociationFieldItemModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});
