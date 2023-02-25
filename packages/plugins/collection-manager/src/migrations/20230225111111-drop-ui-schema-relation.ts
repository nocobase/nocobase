import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';

export default class extends Migration {
  async up() {
    this.app.log.info('Start to migrate uiSchema to options field');
    const fieldsCount = await this.db.getRepository('fields').count();
    this.app.log.info(`Total ${fieldsCount} fields need to be migrated`);

    const fieldCollection = this.db.getCollection('fields');

    const fieldRecords: Array<FieldModel> = await this.db.getRepository('fields').find();

    const foreignKey = this.app.db.options.underscored ? 'ui_schema_uid' : 'uiSchemaUid';

    const transaction = await this.db.sequelize.transaction();

    try {
      let i = 0;

      for (const fieldRecord of fieldRecords) {
        i++;

        this.app.log.info(
          `Migrate field ${fieldRecord.get('collectionName')}.${fieldRecord.get('name')}, ${i}/${fieldsCount}`,
        );
        const fieldKey = fieldRecord.get('key');
        const foreignKeyValue: any = await this.app.db.sequelize.query(
          `SELECT ${foreignKey}
           FROM ${fieldCollection.addSchemaTableName()}
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

        fieldRecord.set('uiSchema', uiSchema);
        await fieldRecord.save({
          transaction,
        });
      }

      await transaction.commit();
      this.app.log.info('Migrate uiSchema to options field done');
    } catch (error) {
      await transaction.rollback();
      this.app.log.error(error);
    }
  }
}
