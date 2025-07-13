/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import React from 'react';
import { isEmptyFilter, tval } from '@nocobase/utils/client';
import { FilterGroup } from '../components/FilterGroup';
import _ from 'lodash';
import { FieldModel } from '../models/base/FieldModel';

export const dataScope = defineAction({
  name: 'dataScope',
  title: tval('Data scope'),
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': function Component(props) {
        const flowContext = useFlowSettingsContext<FieldModel>();
        let fields;
        const collectionField = flowContext.model.collectionField;
        if (collectionField) {
          fields = collectionField.targetCollection.fields;
        } else {
          const currentBlockModel = flowContext.model.ctx.currentBlockModel;
          fields = currentBlockModel.collection.getFields();
        }
        const ignoreFieldsNames = flowContext.model.props.ignoreFieldsNames || [];
        return (
          <FilterGroup
            value={props.value}
            fields={fields}
            ignoreFieldsNames={ignoreFieldsNames}
            model={flowContext.model}
          />
        );
      },
    },
  },
  defaultParams(ctx) {
    return {
      filter: { $and: [] },
    };
  },
  async handler(ctx, params) {
    // @ts-ignore
    const resource = ctx.model?.resource as MultiRecordResource;
    if (!resource) {
      return;
    }

    if (isEmptyFilter(params.filter)) {
      resource.removeFilterGroup(ctx.model.uid);
    } else {
      resource.addFilterGroup(ctx.model.uid, params.filter);
    }

    // resource.refresh();
  },
});
