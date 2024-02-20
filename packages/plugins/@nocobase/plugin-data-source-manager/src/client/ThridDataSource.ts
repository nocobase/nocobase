import { DataSourceOptions, DataSource } from '@nocobase/client';

export class ThirdDataSource extends DataSource {
  async getDataSource() {
    const service = await this.app.apiClient.request<{
      data: DataSourceOptions;
    }>({
      url: `dataSources:get/${this.key}`,
      params: {
        appends: ['collections'],
      },
    });
    return service.data.data;
  }
}
