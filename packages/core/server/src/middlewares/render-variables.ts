/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import { getDateVars } from '@nocobase/utils';
import { get } from 'lodash';

function getUser(ctx) {
  return async ({ fields }) => {
    const userFields = fields.filter((f) => f && ctx.db.getFieldByPath('users.' + f));
    ctx.logger?.info('filter-parse: ', { userFields });
    if (!ctx.state.currentUser) {
      return;
    }
    if (!userFields.length) {
      return;
    }
    const user = await ctx.db.getRepository('users').findOne({
      filterByTk: ctx.state.currentUser.id,
      fields: userFields,
    });
    ctx.logger?.info('filter-parse: ', {
      $user: user?.toJSON(),
    });
    return ({ field }) => {
      get(user, field);
    };
  };
}

function isNumeric(str: any) {
  if (typeof str === 'number') return true;
  if (typeof str != 'string') return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}
const isDateOperator = (op) => {
  return [
    '$dateOn',
    '$dateNotOn',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
  ].includes(op);
};

function isDate(input) {
  return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

const dateValueWrapper = (value: any, timezone?: string) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 2) {
      value.push('[]', timezone);
    } else if (value.length === 3) {
      value.push(timezone);
    }
    return value;
  }

  if (typeof value === 'string') {
    if (!timezone || /(\+|-)\d\d:\d\d$/.test(value)) {
      return value;
    }
    return value + timezone;
  }

  if (isDate(value)) {
    return value.toISOString();
  }
};

const $date = ({ fields, data, context }) => {
  const timezone = context.timezone;
  const dateVars = getDateVars();
  return (field, keys) => {
    const value = get(dateVars, field);
    const operator = keys[keys.length - 1];
    if (isDateOperator(operator)) {
      const field = context?.getField?.(keys);
      if (field?.constructor.name === 'DateOnlyField' || field?.constructor.name === 'DatetimeNoTzField') {
        return value;
      }
      return dateValueWrapper(value, field?.timezone || timezone);
    }
  };
};

const parser = createJSONTemplateParser();

export async function renderVariables(ctx, next) {
  const filter = ctx.action.params.filter;
  if (!filter) {
    return next();
  }
  ctx.action.params.filter = await parser.render(
    filter,
    {
      $user: getUser(ctx),
      $date,
      $nDate: $date,
      $nRole: ctx.state.currentRole,
    },
    {
      timezone: ctx.get('x-timezone'),
      now: new Date().toISOString(),
      getField: (keys) => {
        const fieldPath = keys.filter((p) => !p.startsWith('$') && !isNumeric(p)).join('.');
        const { resourceName } = ctx.action;
        return ctx.db.getFieldByPath(`${resourceName}.${fieldPath}`);
      },
    },
  );
  await next();
}
