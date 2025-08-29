/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  FlowModel,
  escapeT,
  ModelRenderMode,
  FlowModelContext,
  buildWrapperFieldChildren,
} from '@nocobase/flow-engine';

export class AssociationFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    return buildWrapperFieldChildren(ctx, {
      useModel: 'CollectionFieldFormItemModel',
      fieldUseModel: (f) => f.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel',
    });
  }
}

AssociationFieldItemModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});
