/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, pruneFilter, tExpr, useFlowSettingsContext } from '@nocobase/flow-engine';
import { isEmptyFilter, transformFilter } from '@nocobase/utils/client';
import _ from 'lodash';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../components/filter';
import { FieldModel } from '../models/base/FieldModel';

export const dataScope = defineAction({
  name: 'dataScope',
  title: tExpr('Data scope'),
  uiMode: {
    type: 'dialog',
    props: {
      width: 800,
    },
  },
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': function Component(props) {
        const flowContext = useFlowSettingsContext<FieldModel>();
        return (
          <FilterGroup
            value={props.value}
            FilterItem={(p) => <VariableFilterItem {...p} model={flowContext.model} rightAsVariable />}
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

    const filter = pruneFilter(transformFilter(params.filter));

    if (isEmptyFilter(filter)) {
      resource.removeFilterGroup(ctx.model.uid);
    } else {
      resource.addFilterGroup(ctx.model.uid, filter);
    }
  },
});
