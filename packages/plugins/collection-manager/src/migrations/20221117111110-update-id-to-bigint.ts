import { Migration } from '@nocobase/server';
import { DataTypes } from '../../../../core/database/lib';

export default class UpdateIdToBigIntMigrator extends Migration {
  async up() {
    const db = this.app.db;

    const models = [];

    const transaction = await db.sequelize.transaction();

    const updateToBigInt = async (model, fieldName) => {
      const tableName = model.tableName;
      if (model.rawAttributes[fieldName].type instanceof DataTypes.INTEGER) {
        await this.sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${fieldName}" SET DATA TYPE BIGINT;`, {
          transaction,
        });
      }
    };

    //@ts-ignore
    this.app.db.sequelize.modelManager.forEachModel((model) => {
      models.push(model);
    });

    try {
      for (const model of models) {
        const primaryKeyField = model.tableAttributes[model.primaryKeyField];

        if (primaryKeyField && primaryKeyField.primaryKey) {
          await updateToBigInt(model, model.primaryKeyField);
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

          if (foreignModel && fieldName) {
            await updateToBigInt(foreignModel, fieldName);
          }

          if (type === 'BelongsToMany') {
            const throughModel = association.through.model;
            const otherKey = association.otherKey;
            const foreignKey = association.foreignKey;

            await updateToBigInt(throughModel, otherKey);
            await updateToBigInt(throughModel, foreignKey);
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
