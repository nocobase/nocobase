import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { SnapshotField } from './fields/snapshot-field';

export class SnapshotFieldPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    const collectionHandler = async (model: Model, { transaction }) => {
      const collectionDoc = model.toJSON();

      // 创建 collection 历史记录
      const collectionsHistory = this.app.db.getCollection('collectionsHistory');
      await collectionsHistory.repository.create({
        values: collectionDoc,
      });

      // 创建 collection 初始化 fields 历史记录
      const fieldsHistory = this.app.db.getCollection('fieldsHistory');
      fieldsHistory.repository.createMany({
        records: collectionDoc.fields,
      });
    };

    this.app.db.on('collections.afterCreateWithAssociations', collectionHandler);

    const fieldHandler = async (model: Model, { transaction }) => {
      const fieldDoc = model.get();
      const fieldsHistory = this.app.db.getCollection('fieldsHistory');
      fieldsHistory.repository.create({
        values: fieldDoc,
      });
    };

    this.app.db.on('fields.afterCreateWithAssociations', fieldHandler);
  }

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.db.registerFieldTypes({
      snapshot: SnapshotField,
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SnapshotFieldPlugin;
