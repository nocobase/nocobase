import { DataSourceOptionsV2, DataSourceV2 } from '@nocobase/client';

export class ThirdDataSource extends DataSourceV2 {
  async getDataSource() {
    const service = await this.app.apiClient.request<{
      data: DataSourceOptionsV2;
    }>({
      url: `dataSources:get/${this.key}`,
      params: {
        appends: ['collections'],
      },
    });
    return service.data.data;
  }
}
