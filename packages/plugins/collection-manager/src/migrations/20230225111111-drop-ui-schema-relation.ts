import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';
import { Collection } from '@nocobase/database';

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

    const foreignKey = this.app.db.options.underscored ? 'ui_schema_uid' : 'uiSchemaUid';

    const transaction = await this.db.sequelize.transaction();

    const migrateFieldsSchema = async (collection: Collection) => {
      this.app.log.info(`Start to migrate ${collection.name} collection's ui schema`);

      const fieldRecords: Array<FieldModel> = await collection.repository.find();
      const fieldsCount = await collection.repository.count();
      this.app.log.info(`Total ${fieldsCount} fields need to be migrated`);

      let i = 0;

      for (const fieldRecord of fieldRecords) {
        i++;

        this.app.log.info(
          `Migrate field ${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}, ${i}/${fieldsCount}`,
        );

        const fieldKey = fieldRecord.get('key');
        const foreignKeyValue: any = await this.app.db.sequelize.query(
          `SELECT ${foreignKey}
           FROM ${collection.addSchemaTableName()}
           WHERE key = '${fieldKey}'`,
          {
            type: 'SELECT',
            transaction,
          },
        );

        if (foreignKeyValue.length == 0) {
          continue;
        }

        const uiSchemaUid = foreignKeyValue[0][foreignKey];

        const uiSchemaRecord = await this.db.getRepository('uiSchemas').findOne({
          filterByTk: uiSchemaUid,
          transaction,
        });

        const uiSchema = uiSchemaRecord.get('schema');

        fieldRecord.set('options', {
          options: fieldRecord.get('options'),
          uiSchema,
        });

        await fieldRecord.save({
          transaction,
        });
      }

      await transaction.commit();
      this.app.log.info('Migrate uiSchema to options field done');
    };

    try {
      await migrateFieldsSchema(this.db.getCollection('fields'));

      if (this.db.getCollection('fieldsHistory')) {
        await migrateFieldsSchema(this.db.getCollection('fieldsHistory'));
      }
    } catch (error) {
      await transaction.rollback();
      this.app.log.error(error);
      throw error;
    }
  }
}
