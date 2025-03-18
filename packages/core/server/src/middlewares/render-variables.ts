/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import { getDateVars, isDate, parseDate } from '@nocobase/utils';
import { get } from 'lodash';

function getUser(ctx) {
  const getValue = async ({ fields }) => {
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
  return { getValue };
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

const dateValueWrapper = (value: any, timezone?: string) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const valueString = value.map((v) => {
      if (isDate(v)) {
        return v.toISOString();
      }
      return v;
    });
    if (valueString.length === 2) {
      valueString.push('[]', timezone);
    } else if (value.length === 3) {
      valueString.push(timezone);
    }
    return valueString;
  }

  if (typeof value === 'string') {
    if (!timezone || /((\+|-)\d\d:\d\d|Z)$/.test(value)) {
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
  const now = new Date().toISOString();
  const dateVars = getDateVars();

  const getValue = ({ field, keys }) => {
    const val = get(dateVars, field);
    const operator = keys[keys.length - 1];
    const value = typeof val === 'function' ? val?.({ field, operator, timezone, now }) : val;
    const parsedValue = parseDate(value, { timezone });
    return parsedValue;
  };
  const afterApplyHelpers = ({ field, value, keys }) => {
    const operator = keys[keys.length - 1];
    if (isDateOperator(operator)) {
      const ctxField = context?.getField?.(keys);
      if (ctxField?.constructor.name === 'DateOnlyField' || ctxField?.constructor.name === 'DatetimeNoTzField') {
        return value;
      }
      const result = dateValueWrapper(value, ctxField?.timezone || timezone);
      return result;
    }
    return value;
  };
  return { getValue, afterApplyHelpers };
};

const parser = createJSONTemplateParser();

export async function renderVariables(ctx, next) {
  const filter = ctx.action.params.filter;
  if (!filter) {
    return next();
  }
  const renderedFilter = await parser.render(
    filter,
    {
      $user: getUser(ctx),
      $date,
      $nDate: $date,
      $nRole: ctx.state.currentRole === '__union__' ? ctx.state.currentRoles : ctx.state.currentRole,
    },
    {
      timezone: ctx.get('x-timezone'),
      now: new Date().toISOString(),
      getField: (keys) => {
        const fieldPath = keys.filter((p) => typeof p === 'string' && !p.startsWith('$')).join('.');
        const { resourceName } = ctx.action;
        const field = ctx.db.getFieldByPath(`${resourceName}.${fieldPath}`);
        return field;
      },
    },
  );
  ctx.action.params.filter = renderedFilter;
  await next();
}
