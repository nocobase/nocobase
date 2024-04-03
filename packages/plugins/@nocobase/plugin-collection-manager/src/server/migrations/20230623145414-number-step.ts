import { Collection } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';
import _ from 'lodash';

export default class extends Migration {
  appVersion = '<0.10.0-alpha.3';
  async up() {
    const transaction = await this.db.sequelize.transaction();

    const migrateFieldsSchema = async (collection: Collection) => {
      this.app.log.info(`Start to migrate ${collection.name} collection's ui schema`);

      const fieldRecords: Array<FieldModel> = await collection.repository.find({
        transaction,
        filter: {
          type: ['bigInt', 'float', 'double'],
        },
      });

      this.app.log.info(`Total ${fieldRecords.length} fields need to be migrated`);

      for (const fieldRecord of fieldRecords) {
        const uiSchema = fieldRecord.get('uiSchema');
        if (uiSchema?.['x-component-props']?.step !== '0') {
          continue;
        }
        _.set(uiSchema, 'x-component-props.step', '1');
        fieldRecord.set('uiSchema', uiSchema);
        await fieldRecord.save({
          transaction,
        });
        console.log(`changed: ${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}`);
      }
    };

    try {
      await migrateFieldsSchema(this.db.getCollection('fields'));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.app.log.error(error);
      throw error;
    }
  }
}
