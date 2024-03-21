import { Collection } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';

export default class extends Migration {
  appVersion = '<0.9.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<=0.9.2-alpha.5');

    if (!result) {
      return;
    }

    const transaction = await this.db.sequelize.transaction();

    const migrateFieldsSchema = async (collection: Collection) => {
      this.app.log.info(`Start to migrate ${collection.name} collection's ui schema`);

      const fieldRecords: Array<FieldModel> = await collection.repository.find({
        transaction,
        filter: {
          type: ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'],
        },
      });

      const fieldsCount = await collection.repository.count({
        transaction,
        filter: {
          type: ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'],
        },
      });

      this.app.log.info(`Total ${fieldsCount} fields need to be migrated`);

      let i = 0;

      for (const fieldRecord of fieldRecords) {
        i++;

        this.app.log.info(
          `Migrate field ${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}, ${i}/${fieldsCount}`,
        );

        const uiSchema = fieldRecord.get('uiSchema');

        if (uiSchema?.['x-component'] !== 'RecordPicker') {
          continue;
        }

        console.log(`${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}: ${uiSchema['x-component']}`);

        uiSchema['x-component'] = 'AssociationField';
        fieldRecord.set('uiSchema', uiSchema);

        await fieldRecord.save({
          transaction,
        });
      }
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
