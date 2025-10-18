/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { isEmptyFilter, removeNullCondition, transformFilter, tval } from '@nocobase/utils/client';
import _ from 'lodash';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../components/filter';

export const setTargetDataScope = defineAction({
  name: 'setTargetDataScope',
  title: tval('Set data scope'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  uiSchema: {
    targetBlockUid: {
      type: 'string',
      title: tval('Target block UID'),
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: tval('Please enter the target block UID'),
      },
    },
    filter: {
      type: 'object',
      title: tval('Condition'),
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
  async handler(ctx, params) {
    const targetBlockUid = params.targetBlockUid;
    if (!targetBlockUid) {
      return;
    }

    const targetModel = ctx.engine.getModel(targetBlockUid, true);
    if (!targetModel) {
      return;
    }

    // @ts-ignore
    const resource = targetModel.resource as MultiRecordResource;
    if (!resource) {
      return;
    }

    const filter = removeNullCondition(transformFilter(params.filter));

    if (isEmptyFilter(filter)) {
      resource.removeFilterGroup(`setTargetDataScope_${ctx.model.uid}`);
    } else {
      resource.addFilterGroup(`setTargetDataScope_${ctx.model.uid}`, filter);
    }
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
