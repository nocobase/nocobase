import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class UpdateIdToBigIntMigrator extends Migration {
  appVersion = '<0.8.1-alpha.2';
  async up() {
    const result = await this.app.version.satisfies('<0.9.0-alpha.1');
    if (!result) {
      return;
    }
    const db = this.app.db;

    await db.getCollection('fields').repository.update({
      filter: {
        $or: [
          {
            name: 'id',
            type: 'integer',
          },
        ],
      },
      values: {
        type: 'bigInt',
      },
    });

    if (!db.inDialect('mysql', 'mariadb', 'postgres')) {
      return;
    }

    const models = [];

    const queryInterface = db.sequelize.getQueryInterface() as any;

    const queryGenerator = queryInterface.queryGenerator as any;

    const updateToBigInt = async (model, fieldName) => {
      const columnName = model.rawAttributes[fieldName].field;
      let sql;

      const tableName = model.tableName;
      const addSchemaTableName = db.utils.addSchema(tableName);
      const quoteTableName = db.utils.quoteTable(addSchemaTableName);

      const collection = db.modelCollection.get(model);

      const fieldRecord = await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: collection.name,
          name: fieldName,
          type: 'integer',
        },
      });

      if (fieldRecord) {
        fieldRecord.set('type', 'bigInt');
        await fieldRecord.save();
      }

      if (model.rawAttributes[fieldName].type instanceof DataTypes.INTEGER) {
        if (db.inDialect('postgres')) {
          sql = `ALTER TABLE ${quoteTableName} ALTER COLUMN "${columnName}" SET DATA TYPE BIGINT;`;
        } else if (db.inDialect('mysql', 'mariadb')) {
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

          sql = queryGenerator.changeColumnQuery(addSchemaTableName, query);

          sql = sql.replace(' PRIMARY KEY;', ' ;');
        }

        try {
          await this.sequelize.query(sql, {});
        } catch (err) {
          if (err.message.includes('does not exist') || err.message.includes('cannot alter inherited column')) {
            return;
          }
          throw err;
        }

        if (db.inDialect('postgres')) {
          const sequenceQuery = `SELECT pg_get_serial_sequence('${quoteTableName}', '${columnName}');`;
          const [result] = await this.sequelize.query(sequenceQuery, {});
          const sequenceName = result[0]['pg_get_serial_sequence'];

          if (sequenceName) {
            await this.sequelize.query(`ALTER SEQUENCE ${sequenceName} AS BIGINT;`, {});
          }
        }

        this.app.log.info(`updated ${tableName}.${fieldName} to BIGINT`, { tableName, fieldName });
      }
    };

    const singleForeignFields = await db.getCollection('fields').repository.find({
      filter: {
        options: {
          isForeignKey: true,
        },
        type: 'integer',
      },
    });

    for (const field of singleForeignFields) {
      const collection = db.getCollection(field.get('collectionName'));
      if (!collection) {
        console.log('collection not found', field.get('collectionName'));
      }

      await updateToBigInt(collection.model, field.get('name'));
    }

    //@ts-ignore
    this.app.db.sequelize.modelManager.forEachModel((model) => {
      models.push(model);
    });

    for (const model of models) {
      try {
        const primaryKeyField = model.tableAttributes[model.primaryKeyField];

        const collection = db.modelCollection.get(model);

        if (!collection) {
          continue;
        }

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
