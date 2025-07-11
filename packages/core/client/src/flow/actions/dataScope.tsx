/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, useFlowModel, useStepSettingContext } from '@nocobase/flow-engine';
import React from 'react';
import { isEmptyFilter, tval } from '@nocobase/utils/client';
import { FilterGroup } from '../components/FilterGroup';
import _ from 'lodash';

export const dataScope = defineAction({
  name: 'dataScope',
  title: tval('Data scope'),
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': (props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { model: modelInstance } = useStepSettingContext();
        let fields = [];
        const collectionField = modelInstance.collectionField;
        if (collectionField) {
          fields = collectionField.targetCollection.fields;
        } else {
          const currentBlockModel = modelInstance.ctx.currentBlockModel;
          fields = currentBlockModel.collection.getFields();
        }
        const ignoreFieldsNames = modelInstance.props.ignoreFieldsNames || [];
        return (
          <FilterGroup
            value={props.value}
            fields={fields}
            ignoreFieldsNames={ignoreFieldsNames}
            model={modelInstance}
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
