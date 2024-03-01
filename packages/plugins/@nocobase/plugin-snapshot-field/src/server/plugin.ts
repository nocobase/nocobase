import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { SnapshotField } from './fields/snapshot-field';

export class SnapshotFieldPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    const collectionHandler = async (model: Model, { transaction }) => {
      const collectionDoc = model.toJSON();
      const collectionsHistoryRepository = this.app.db.getRepository('collectionsHistory');
      const fieldsHistoryRepository = this.app.db.getRepository('fieldsHistory');

      const existCollection: Model = await collectionsHistoryRepository.findOne({
        filter: {
          name: collectionDoc.name,
        },
        transaction,
      });

      if (existCollection) {
        // 删除表和其关联字段
        await existCollection.destroy({
          transaction,
        });
      }

      await collectionsHistoryRepository.create({
        values: collectionDoc,
        transaction,
      });

      // await fieldsHistoryRepository.createMany({
      //   records: collectionDoc.fields ?? [],
      //   transaction,
      // });
    };

    this.app.db.on('collections.afterCreateWithAssociations', collectionHandler);

    const deleteField = async (field, transaction) => {
      const fieldsHistoryRepository = this.app.db.getRepository('fieldsHistory');

      const { name, collectionName } = field;

      await fieldsHistoryRepository.destroy({
        filter: { name, collectionName },
        transaction,
      });
    };

    const fieldHandler = async (model: Model, { transaction }) => {
      const fieldsHistoryRepository = this.app.db.getRepository('fieldsHistory');

      const fieldDoc = model.get();

      await deleteField(fieldDoc, transaction);

      const reverseField = fieldDoc.reverseField;

      if (reverseField) {
        await deleteField(reverseField, transaction);
      }

      await fieldsHistoryRepository.create({
        values: JSON.parse(JSON.stringify(fieldDoc)),
        transaction,
      });
    };

    this.app.db.on('fields.afterCreateWithAssociations', fieldHandler);
    this.app.db.on('fields.beforeCreate', this.autoFillTargetCollection);
  }

  autoFillTargetCollection = async (model: Model) => {
    const { collectionName, targetField } = model.get();
    const collection = this.db.getCollection(collectionName);
    if (!collection) {
      return;
    }
    const field = collection.getField(targetField);
    if (field?.target) {
      model.set('targetCollection', field.target);
    }
  };

  async load() {
    // 导入 collection
    await this.importCollections(resolve(__dirname, 'collections'));

    this.app.db.registerFieldTypes({
      snapshot: SnapshotField,
    });

    this.app.acl.allow('collectionsHistory', 'list', 'loggedIn');
  }

  // 初始化安装的时候
  async install(options?: InstallOptions) {
    await this.app.db.sequelize.transaction(async (transaction) => {
      const collectionsRepository = this.app.db.getRepository('collections');
      const collectionsHistoryRepository = this.app.db.getRepository('collectionsHistory');

      if ((await collectionsHistoryRepository.find()).length === 0) {
        const collectionsModels: Model[] = await collectionsRepository.find();
        await collectionsHistoryRepository.createMany({
          records: collectionsModels.map((m) => m.get()),
          transaction,
        });
      }

      const fieldsRepository = this.app.db.getRepository('fields');
      const fieldsHistoryRepository = this.app.db.getRepository('fieldsHistory');

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
