/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '../../../api-client';

export const requestChartData = (options) => {
  return async function (this: { api: APIClient }) {
    try {
      const response = await this.api.request(options);
      return response?.data?.data;
    } catch (error) {
      return [];
    }
  };
};
