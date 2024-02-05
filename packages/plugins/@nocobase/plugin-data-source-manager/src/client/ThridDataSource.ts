import { DataSourceV2 } from '@nocobase/client';

export class ThirdDataSource extends DataSourceV2 {
  async getCollections() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      url: `dataSources/${this.key}/collections:list`,
      params: {
        paginate: false,
        appends: ['fields'],
      },
    });

    return service?.data?.data;
  }
}
