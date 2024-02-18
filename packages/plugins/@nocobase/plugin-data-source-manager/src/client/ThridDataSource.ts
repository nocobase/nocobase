import { DataSourceV2 } from '@nocobase/client';

export class ThirdDataSource extends DataSourceV2 {
  async getDataSource() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      url: `dataSources/${this.key}/collections:list`,
      params: {
        paginate: false,
        appends: ['fields'],
      },
    });

    const collections = service?.data?.data;
    return {
      collections,
    };
  }
}
