/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { FilterGroup, LinkageFilterItem } from './filter';
import { evaluateConditions, FilterGroupType } from '@nocobase/utils/client';

export const ConditionBuilder = observer(
  (props: { value: FilterGroupType; onChange: (value: FilterGroupType) => void }) => {
    const ctx = useFlowContext();

    return (
      <FilterGroup
        value={props.value || { logic: '$and', items: [] }}
        FilterItem={(props) => <LinkageFilterItem model={ctx.model} value={props.value} />}
        onChange={props.onChange}
      />
    );
  },
);

export const commonConditionHandler = (ctx, params) => {
  const { condition = { logic: '$and', items: [] } } = params;
  const evaluator = (path: string, operator: string, value: any) => {
    return ctx.app.jsonLogic.apply({ [operator]: [path, value] });
  };

  if (!evaluateConditions(condition, evaluator)) {
    ctx.exit();
  }
};
