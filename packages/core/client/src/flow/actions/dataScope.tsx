/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, useStepSettingContext } from '@nocobase/flow-engine';
import { FilterGroup } from '../components/FilterGroup';
import React from 'react';

export const dataScope = defineAction({
  name: 'dataScope',
  title: '数据范围',
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': (props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { model: modelInstance } = useStepSettingContext();
        const currentBlockModel = modelInstance.ctx.shared.currentBlockModel;
        const fields = currentBlockModel.collection.options.fields;
        const ignoreFieldsNames = modelInstance.props.ignoreFieldsNames || [];

        return (
          <FilterGroup
            value={props.value}
            fields={fields}
            ignoreFieldsNames={ignoreFieldsNames}
            ctx={modelInstance.ctx}
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
    resource.addFilterGroup(ctx.model.uid, params.filter);
    resource.refresh();
  },
});
