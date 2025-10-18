/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, MultiRecordResource, useFlowContext, useFlowModel } from '@nocobase/flow-engine';
import { isEmptyFilter, removeNullCondition, transformFilter, tval } from '@nocobase/utils/client';
import _ from 'lodash';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../components/filter';

export const setTargetDataScope = defineAction({
  name: 'setTargetDataScope',
  title: tval('Set data scope'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  uiSchema: {
    filter: {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': function Component(props) {
        const ctx = useFlowContext();
        return (
          <FilterGroup
            value={props.value}
            FilterItem={(p) => <VariableFilterItem {...p} model={ctx.model} rightAsVariable />}
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
