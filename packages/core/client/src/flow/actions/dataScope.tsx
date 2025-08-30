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
import { isEmptyFilter, removeNullCondition, tval } from '@nocobase/utils/client';
import _ from 'lodash';
import { FieldModel } from '../models/base/FieldModel';
import { FilterGroup, FilterItem, transformFilter } from '../components/filter';

export const dataScope = defineAction({
  name: 'dataScope',
  title: tval('Data scope'),
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': function Component(props) {
        const flowContext = useFlowSettingsContext<FieldModel>();
        return (
          <FilterGroup
            value={props.value}
            FilterItem={(props) => <FilterItem {...props} model={flowContext.model} noIgnore />}
          />
        );
      },
    },
  },
  defaultParams(ctx) {
    return {
      filter: { logic: '$and', items: [] },
    };
  },
  async handler(ctx, params) {
    // @ts-ignore
    const resource = ctx.model?.resource as MultiRecordResource;
    if (!resource) {
      return;
    }

    const filter = removeNullCondition(transformFilter(params.filter));

    if (isEmptyFilter(filter)) {
      resource.removeFilterGroup(ctx.model.uid);
    } else {
      resource.addFilterGroup(ctx.model.uid, filter);
    }
  },
});
