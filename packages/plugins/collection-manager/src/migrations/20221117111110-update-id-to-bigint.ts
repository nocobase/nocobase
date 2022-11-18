import { Migration } from '@nocobase/server';
import { DataTypes } from '../../../../core/database/lib';

export default class UpdateIdToBigIntMigrator extends Migration {
  async up() {
    const db = this.app.db;

    await db.getCollection('fields').repository.update({
      filter: {
        name: 'id',
        type: 'integer',
      },
      values: {
        type: 'bigInt',
      },
    });

    if (!db.inDialect('mysql', 'postgres')) {
      return;
    }

    const models = [];

    const queryInterface = db.sequelize.getQueryInterface() as any;

    const queryGenerator = queryInterface.queryGenerator as any;

    const updateToBigInt = async (model, fieldName) => {
      const tableName = model.tableName;
      if (model.rawAttributes[fieldName].type instanceof DataTypes.INTEGER) {
        if (db.inDialect('postgres')) {
          await this.sequelize.query(
            `ALTER TABLE "${tableName}" ALTER COLUMN "${fieldName}" SET DATA TYPE BIGINT;`,
            {},
          );
        } else if (db.inDialect('mysql')) {
          const dataTypeOrOptions = model.rawAttributes[fieldName];
          const attributeName = fieldName;

          const query = queryGenerator.attributesToSQL(
            {
              [attributeName]: queryInterface.normalizeAttribute({
                ...dataTypeOrOptions,
                type: DataTypes.BIGINT,
              }),
            },
            {
              context: 'changeColumn',
              table: tableName,
            },
          );
          const sql = queryGenerator.changeColumnQuery(tableName, query);

          await this.sequelize.query(sql.replace(' PRIMARY KEY;', ' ;'), {});
        }

        this.app.log.info(`updated ${tableName}.${fieldName} to BIGINT`, tableName, fieldName);
      }
    };

    //@ts-ignore
    this.app.db.sequelize.modelManager.forEachModel((model) => {
      models.push(model);
    });

    for (const model of models) {
      try {
        const primaryKeyField = model.tableAttributes[model.primaryKeyField];

        if (primaryKeyField && primaryKeyField.primaryKey) {
          await updateToBigInt(model, model.primaryKeyField);
        }

        if (model.tableAttributes['sort'] && model.tableAttributes['sort'].type instanceof DataTypes.INTEGER) {
          await updateToBigInt(model, 'sort');
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
      } catch (error) {
        if (error.message.includes('cannot alter inherited column')) {
          continue;
        }

        throw error;
      }
    }
  }
}
