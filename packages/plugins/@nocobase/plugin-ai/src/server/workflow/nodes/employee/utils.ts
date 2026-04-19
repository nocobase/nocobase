/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

export const preserveHistory = (currentResult: any, nextResult: any) => {
  const historyMessages = currentResult?.historyMessages;
  if (historyMessages === undefined) {
    return nextResult;
  }

  if (_.isPlainObject(nextResult)) {
    return {
      ...nextResult,
      historyMessages,
    };
  }

  return {
    historyMessages,
    value: nextResult,
  };
};

export const withHistory = (currentResult: any, historyMessages: any[]) => {
  if (_.isPlainObject(currentResult)) {
    return {
      ...currentResult,
      historyMessages,
    };
  }

  return {
    historyMessages,
    value: currentResult,
  };
};
