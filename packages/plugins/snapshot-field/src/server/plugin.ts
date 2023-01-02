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
        transaction,
      });

      // 创建 collection 初始化 fields 历史记录
      const fieldsHistory = this.app.db.getCollection('fieldsHistory');
      await fieldsHistory.repository.createMany({
        records: collectionDoc.fields ?? [],
        transaction,
      });
    };

    this.app.db.on('collections.afterCreateWithAssociations', collectionHandler);

    const fieldHandler = async (model: Model, { transaction }) => {
      const fieldDoc = model.get();
      const fieldsHistory = this.app.db.getCollection('fieldsHistory');
      await fieldsHistory.repository.create({
        values: fieldDoc,
        transaction,
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

  // 初始化安装的时候
  async install(options?: InstallOptions) {
    await this.app.db.sequelize.transaction(async (transaction) => {
      const collectionsRepository = this.app.db.getCollection('collections').repository;
      const collectionsHistoryRepository = this.app.db.getCollection('collectionsHistory').repository;

      if ((await collectionsHistoryRepository.find()).length === 0) {
        const collectionsModels: Model[] = await collectionsRepository.find();
        await collectionsHistoryRepository.createMany({
          records: collectionsModels.map((m) => m.get()),
          transaction,
        });
      }

      const fieldsRepository = this.app.db.getCollection('fields').repository;
      const fieldsHistoryRepository = this.app.db.getCollection('fieldsHistory').repository;

      if ((await fieldsHistoryRepository.find()).length === 0) {
        const fieldsModels: Model[] = await fieldsRepository.find();
        await fieldsHistoryRepository.createMany({
          records: fieldsModels.map((m) => m.get()),
          transaction,
        });
      }
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SnapshotFieldPlugin;
