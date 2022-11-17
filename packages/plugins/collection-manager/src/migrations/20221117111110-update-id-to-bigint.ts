import { Migration } from '@nocobase/server';
import { DataTypes } from '../../../../core/database/lib';

export default class UpdateIdToBigIntMigrator extends Migration {
  async up() {
    const db = this.app.db;

    const models = [];

    const transaction = await db.sequelize.transaction();

    const updateToBigInt = async (tableName, fieldName) => {
      await this.sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${fieldName}" SET DATA TYPE BIGINT;`, {
        transaction,
      });
    };

    //@ts-ignore
    this.app.db.sequelize.modelManager.forEachModel((model) => {
      models.push(model);
    });

    try {
      for (const model of models) {
        const primaryKeyField = model.tableAttributes[model.primaryKeyField];

        if (primaryKeyField && primaryKeyField.type.key === 'INTEGER' && primaryKeyField.primaryKey) {
          await updateToBigInt(model.tableName, model.primaryKeyField);
        }

        const associations = model.associations;
        for (const associationName of Object.keys(associations)) {
          const association = associations[associationName];

          const type = association.associationType;
          let foreignModel;
          let fieldName;

          if (type === 'BelongsTo') {
            foreignModel = association.source;
            fieldName = association.foreignKey;
          }

          if (type === 'HasMany') {
            foreignModel = association.target;
            fieldName = association.foreignKey;
          }

          if (type === 'HasOne') {
            foreignModel = association.target;
            fieldName = association.foreignKey;
          }

          if (foreignModel && fieldName && foreignModel.tableAttributes[fieldName].type.key === 'INTEGER') {
            await updateToBigInt(foreignModel.tableName, fieldName);
          }

          if (type === 'BelongsToMany') {
            const throughModel = association.through.model;
            const otherKey = association.otherKey;
            const foreignKey = association.foreignKey;

            await updateToBigInt(throughModel.tableName, otherKey);
            await updateToBigInt(throughModel.tableName, foreignKey);
          }
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.app.log.error(error);
    }
  }
}
