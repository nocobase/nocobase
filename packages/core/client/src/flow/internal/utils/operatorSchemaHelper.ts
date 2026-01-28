/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DateFilterDynamicComponent } from '../../models/blocks/filter-form/fields/date-time/components/DateFilterDynamicComponent';

/**
 * 根据操作符的 schema 定位组件及其 props。
 */
export function resolveOperatorComponent(app: any, operator: string, operators?: Array<any>) {
  if (!operators || !Array.isArray(operators)) return null;
  const op = operators.find((item) => item?.value === operator);
  const schema = op?.schema;
  const xComp = schema?.['x-component'];
  if (!xComp) return null;
  let Comp;
  if (xComp === 'DateFilterDynamicComponent') {
    Comp = DateFilterDynamicComponent;
  } else {
    Comp = app?.getComponent?.(xComp as any);
  }
  if (!Comp) return null;
  const props = (schema?.['x-component-props'] as Record<string, any>) || {};
  return { Comp, props };
}
