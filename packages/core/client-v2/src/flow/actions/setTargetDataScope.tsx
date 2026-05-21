/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionScene,
  defineAction,
  extractUsedVariablePaths,
  FlowModel,
  MultiRecordResource,
  useFlowContext,
  tExpr,
} from '@nocobase/flow-engine';
import { isEmptyFilter } from '@nocobase/utils/client';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../components/filter';
import { normalizeDataScopeFilter } from './dataScopeFilter';

function dependsOnClickedRowRecord(filter: any) {
  if (!filter) {
    return false;
  }
  const used = extractUsedVariablePaths(filter) || {};
  return Object.prototype.hasOwnProperty.call(used, 'clickedRowRecord');
}

function shouldClearClickedRowDataScope(ctx: any, params: any) {
  return ctx.inputArgs?.selected === false && dependsOnClickedRowRecord(params.filter);
}

function resolveTargetDataScopeFilter(ctx: any, params: any, resolvedParams: any) {
  if (shouldClearClickedRowDataScope(ctx, params)) {
    return undefined;
  }

  return normalizeDataScopeFilter(params.filter, resolvedParams.filter);
}

function shouldRefreshTargetResource(resource: MultiRecordResource) {
  if (resource.hasData()) {
    return true;
  }

  return resource.getMeta?.('count') !== undefined || resource.getMeta?.('hasNext') !== undefined;
}

export const setTargetDataScope = defineAction({
  name: 'setTargetDataScope',
  title: tExpr('Set data scope'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 200,
  uiSchema: {
    targetBlockUid: {
      type: 'string',
      title: tExpr('Target block UID'),
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: tExpr('Please enter the target block UID'),
      },
    },
    filter: {
      type: 'object',
      title: tExpr('Condition'),
      'x-decorator': 'FormItem',
      'x-component': SetTargetDataScope,
      'x-reactions': [
        {
          dependencies: ['targetBlockUid'],
          fulfill: {
            state: {
              componentProps: {
                uid: '{{$deps[0]}}',
              },
              hidden: '{{!$deps[0]}}',
            },
          },
        },
      ],
    },
  },
  defaultParams(ctx) {
    return {
      targetBlockUid: '',
      filter: { logic: '$and', items: [] },
    };
  },
  useRawParams: true,
  async handler(ctx, params) {
    const resolvedParams = await ctx.resolveJsonTemplate(params);
    const targetBlockUid = resolvedParams.targetBlockUid;
    if (!targetBlockUid) {
      return;
    }
    const model: FlowModel = ctx.model;
    const filter = resolveTargetDataScopeFilter(ctx, params, resolvedParams);

    model.scheduleModelOperation(targetBlockUid, (targetModel) => {
      const resource = targetModel['resource'] as MultiRecordResource;
      if (!resource) {
        return;
      }

      if (isEmptyFilter(filter)) {
        resource.removeFilterGroup(`setTargetDataScope_${ctx.model.uid}`);
      } else {
        resource.addFilterGroup(`setTargetDataScope_${ctx.model.uid}`, filter);
      }
      if (shouldRefreshTargetResource(resource)) {
        resource.refresh();
      }
    });
  },
});

function SetTargetDataScope(props) {
  const ctx = useFlowContext();
  const targetBlockUid = props.uid;

  const targetModel = ctx.engine.getModel(targetBlockUid, true);

  if (!targetModel) {
    return (
      <div style={{ color: ctx.themeToken.colorError }}>
        {ctx.t('Cannot find the model instance with UID')}: {targetBlockUid}
      </div>
    );
  }

  return (
    <FilterGroup
      value={props.value}
      FilterItem={(p) => <VariableFilterItem {...p} model={targetModel} rightAsVariable />}
    />
  );
}
