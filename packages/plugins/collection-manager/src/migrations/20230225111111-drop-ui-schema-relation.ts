import { Collection } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';

export default class extends Migration {
  async up() {
    const migratedFieldsCount = await this.db.getRepository('fields').count({
      filter: {
        'options.uiSchema': { $exists: true },
      },
    });

    if (migratedFieldsCount > 0) {
      return;
    }

    const transaction = await this.db.sequelize.transaction();

    const migrateFieldsSchema = async (collection: Collection) => {
      this.app.log.info(`Start to migrate ${collection.name} collection's ui schema`);

      collection.setField('uiSchemaUid', {
        type: 'string',
      });

      const fieldRecords: Array<FieldModel> = await collection.repository.find({
        transaction,
      });

      const fieldsCount = await collection.repository.count({
        transaction,
      });

      this.app.log.info(`Total ${fieldsCount} fields need to be migrated`);

      let i = 0;

      for (const fieldRecord of fieldRecords) {
        i++;

        this.app.log.info(
          `Migrate field ${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}, ${i}/${fieldsCount}`,
        );

        const uiSchemaUid = fieldRecord.get('uiSchemaUid');

        if (!uiSchemaUid) {
          continue;
        }

        const uiSchemaRecord = await this.db.getRepository('uiSchemas').findOne({
          filterByTk: uiSchemaUid,
          transaction,
        });

        const uiSchema = uiSchemaRecord.get('schema');

        fieldRecord.set('uiSchema', uiSchema);

        await fieldRecord.save({
          transaction,
        });
      }

      collection.removeField('uiSchemaUid');
      this.app.log.info('Migrate uiSchema to options field done');
    };

    try {
      await migrateFieldsSchema(this.db.getCollection('fields'));

      if (this.db.getCollection('fieldsHistory')) {
        await migrateFieldsSchema(this.db.getCollection('fieldsHistory'));
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.app.log.error(error);
      throw error;
    }
  }
}
