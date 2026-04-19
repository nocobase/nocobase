/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

type WorkflowJobResult = {
  data?: any;
  error?: any;
  debug?: {
    messages?: any[];
    [key: string]: any;
  };
};

const hasOwn = (value: any, key: string) => Object.prototype.hasOwnProperty.call(value, key);

const compactWorkflowJobResult = (result: WorkflowJobResult) => {
  const nextResult: WorkflowJobResult = {};

  if (result.data !== undefined) {
    nextResult.data = result.data;
  }
  if (result.error !== undefined) {
    nextResult.error = result.error;
  }

  const debug = _.omitBy(result.debug ?? {}, _.isUndefined);
  if (Object.keys(debug).length > 0) {
    nextResult.debug = debug;
  }

  return nextResult;
};

export const normalizeWorkflowJobResult = (currentResult: any): WorkflowJobResult => {
  if (_.isPlainObject(currentResult) && ['data', 'error', 'debug'].some((key) => hasOwn(currentResult, key))) {
    return compactWorkflowJobResult({
      data: currentResult.data,
      error: currentResult.error,
      debug: _.isPlainObject(currentResult.debug) ? currentResult.debug : {},
    });
  }

  if (_.isPlainObject(currentResult)) {
    const debug = hasOwn(currentResult, 'historyMessages') ? { messages: currentResult.historyMessages } : undefined;
    if (
      hasOwn(currentResult, 'value') &&
      Object.keys(currentResult).every((key) => ['value', 'historyMessages'].includes(key))
    ) {
      return compactWorkflowJobResult({
        data: currentResult.value,
        debug,
      });
    }

    const data = _.omit(currentResult, ['historyMessages']);
    return compactWorkflowJobResult({
      data: Object.keys(data).length > 0 ? data : undefined,
      debug,
    });
  }

  return compactWorkflowJobResult({
    data: currentResult,
  });
};

const mergeWorkflowJobResult = (currentResult: any, nextResult: WorkflowJobResult) => {
  const normalizedCurrentResult = normalizeWorkflowJobResult(currentResult);

  return compactWorkflowJobResult({
    ...normalizedCurrentResult,
    ...nextResult,
    debug:
      nextResult.debug === undefined
        ? normalizedCurrentResult.debug
        : _.omitBy({ ...(normalizedCurrentResult.debug ?? {}), ...nextResult.debug }, _.isUndefined),
  });
};

export const withData = (currentResult: any, data: any) => {
  return mergeWorkflowJobResult(currentResult, {
    data,
    error: undefined,
  });
};

export const withError = (currentResult: any, error: any) => {
  return mergeWorkflowJobResult(currentResult, {
    data: undefined,
    error,
  });
};

export const withHistory = (currentResult: any, historyMessages: any[]) => {
  return mergeWorkflowJobResult(currentResult, {
    debug: {
      messages: historyMessages,
    },
  });
};
