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
