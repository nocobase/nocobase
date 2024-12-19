/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import moment from 'moment';

export function filterMatch(model, where) {
  // Create an object that maps operator names to functions
  const operatorFunctions = {
    // string
    $eq: (value, condition) => value === condition,
    $not: (value, condition) => !filterMatch(model, condition),
    $includes: (value, condition) => value.includes(condition),
    $notIncludes: (value, condition) => !value.includes(condition),
    $empty: (value) =>
      value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0),
    $notEmpty: (value) =>
      (value !== null && value !== undefined && value !== '') || (Array.isArray(value) && value.length > 0),

    // array
    $match: (value, condition) => value.some((item) => filterMatch(item, condition)),
    $notMatch: (value, condition) => !value.some((item) => filterMatch(item, condition)),
    $anyOf: (value, condition) => value.some((item) => condition.includes(item)),
    $noneOf: (value, condition) => !value.some((item) => condition.includes(item)),

    // datetime
    $dateOn: (value, condition) => moment(value).isSame(condition, 'day'),
    $dateNotOn: (value, condition) => !moment(value).isSame(condition, 'day'),
    $dateBefore: (value, condition) => moment(value).isBefore(condition, 'day'),
    $dateAfter: (value, condition) => moment(value).isAfter(condition, 'day'),
    $dateNotBefore: (value, condition) => !moment(value).isBefore(condition, 'day'),
    $dateNotAfter: (value, condition) => !moment(value).isAfter(condition, 'day'),

    $gt: (value, condition) => value > condition,
    $gte: (value, condition) => value >= condition,
    $lt: (value, condition) => value < condition,
    $lte: (value, condition) => value <= condition,
    $ne: (value, condition) => value !== condition,
    $in: (value, condition) => condition.includes(value),
    $or: (model, conditions) => Object.values(conditions).some((condition) => filterMatch(model, condition)),
    $and: (model, conditions) => Object.values(conditions).every((condition) => filterMatch(model, condition)),

    // boolean
    $isFalsy: (value) => !value,
  };

  for (const [key, value] of Object.entries(where)) {
    // Check if the property value contains a logical operator
    if (operatorFunctions[key] !== undefined) {
      // Check if the conditions specified in the property value are satisfied
      if (!operatorFunctions[key](model, value)) {
        return false;
      }
    } else {
      // Check if the property value is an object (which would contain operators)
      if (typeof value === 'object') {
        // Loop through each operator in the property value
        for (const [operator, condition] of Object.entries(value)) {
          // Check if the property value satisfies the condition
          if (!operatorFunctions[operator](model[key], condition)) {
            return false;
          }
        }
      } else {
        // Assume the default operator is "eq"
        if (!operatorFunctions['$eq'](model[key], value)) {
          return false;
        }
      }
    }
  }

  return true;
}
