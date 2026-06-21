/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { FieldAssignValueInput } from '../components/FieldAssignValueInput';

function normalizeDateRangeValue(value: any) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return undefined;
  }
  return value;
}

export const dateRangeLimit = defineAction({
  name: 'dateRangeLimit',
  title: tExpr('Date range limit'),
  uiMode: {
    type: 'dialog',
    props: {
      width: 720,
    },
  },
  uiSchema(ctx: any) {
    const targetPath = ctx.model.context?.collectionField?.name || '';
    const dateLimitInputProps = {
      targetPath,
      enableDateVariableAsConstant: true,
    };

    return {
      _minDate: {
        type: 'string',
        title: tExpr('MinDate'),
        'x-decorator': 'FormItem',
        'x-component': FieldAssignValueInput,
        'x-component-props': dateLimitInputProps,
      },
      _maxDate: {
        type: 'string',
        title: tExpr('MaxDate'),
        'x-decorator': 'FormItem',
        'x-component': FieldAssignValueInput,
        'x-component-props': dateLimitInputProps,
      },
    };
  },
  defaultParams(ctx: any) {
    return {
      _minDate: normalizeDateRangeValue(ctx.model.props?._minDate),
      _maxDate: normalizeDateRangeValue(ctx.model.props?._maxDate),
    };
  },
  useRawParams: true,
  async handler(ctx: any, params) {
    ctx.model.setProps({
      _minDate: normalizeDateRangeValue(params?._minDate),
      _maxDate: normalizeDateRangeValue(params?._maxDate),
    });
  },
});
