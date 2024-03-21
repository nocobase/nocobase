import { Collection } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';

export default class extends Migration {
  appVersion = '<0.9.2-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.9.2-alpha.2');

    if (!result) {
      return;
    }

    const transaction = await this.db.sequelize.transaction();

    const migrateFieldsSchema = async (collection: Collection) => {
      this.app.log.info(`Start to migrate ${collection.name} collection's ui schema`);

      const field = collection.setField('uiSchemaUid', {
        type: 'string',
      });

      const exists = await field.existsInDb({ transaction });

      if (!exists) {
        collection.removeField('uiSchemaUid');
        return;
      }

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

        if (!uiSchemaRecord) {
          continue;
        }

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
