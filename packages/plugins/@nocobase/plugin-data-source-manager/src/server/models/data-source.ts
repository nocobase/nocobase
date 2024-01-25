import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';

export class DataSourceModel extends MagicAttributeModel {
  async loadIntoApplication(options: { app: Application }) {
    const { app } = options;
    const type = this.get('type');
    const createOptions = this.get('options');

    const instance = app.dataSourceManager.factory.create(type, {
      ...createOptions,
      name: this.get('key'),
    });

    await app.dataSourceManager.add(instance);
  }
}
