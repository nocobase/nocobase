import { InheritedCollection } from './inherited-collection';
import lodash from 'lodash';
import { Sequelize } from 'sequelize';

export class SyncRunner {
  static async syncInheritModel(model: any, options: any) {
    const { transaction } = options;

    const inheritedCollection = model.collection as InheritedCollection;
    const db = inheritedCollection.context.database;
    const dialect = db.sequelize.getDialect();

    const queryInterface = db.sequelize.getQueryInterface();

    if (dialect != 'postgres') {
      throw new Error('Inherit model is only supported on postgres');
    }

    const parents = inheritedCollection.parents;

    if (!parents) {
      throw new Error(
        `Inherit model ${inheritedCollection.name} can't be created without parents, parents option is ${lodash
          .castArray(inheritedCollection.options.inherits)
          .join(', ')}`,
      );
    }

    const parentTables = parents.map((parent) => parent.model.tableName);

    const tableName = model.getTableName();

    const attributes = model.tableAttributes;

    const childAttributes = lodash.pickBy(attributes, (value) => {
      return !value.inherit;
    });

    let maxSequenceVal = 0;
    let maxSequenceName;

    if (childAttributes.id && childAttributes.id.autoIncrement) {
      for (const parent of parentTables) {
        const sequenceNameResult = await queryInterface.sequelize.query(
          `SELECT column_default FROM information_schema.columns WHERE 
          table_name='${parent}' and "column_name" = 'id';`,
          {
            transaction,
          },
        );

        if (!sequenceNameResult[0].length) {
          continue;
        }

        const columnDefault = sequenceNameResult[0][0]['column_default'];

        if (!columnDefault) {
          throw new Error(`Can't find sequence name of ${parent}`);
        }

        const regex = new RegExp(/nextval\('(\w+)\'.*\)/);
        const match = regex.exec(columnDefault);

        const sequenceName = match[1];

        const sequenceCurrentValResult = await queryInterface.sequelize.query(
          `select last_value from ${sequenceName}`,
          {
            transaction,
          },
        );
        const sequenceCurrentVal = parseInt(sequenceCurrentValResult[0][0]['last_value']);

        if (sequenceCurrentVal > maxSequenceVal) {
          maxSequenceName = sequenceName;
          maxSequenceVal = sequenceCurrentVal;
        }
      }
    }

    await this.createTable(tableName, childAttributes, options, model, parentTables);

    if (maxSequenceName) {
      const parentsDeep = Array.from(db.inheritanceMap.getParents(inheritedCollection.name)).map(
        (parent) => db.getCollection(parent).model.tableName,
      );

      const sequenceTables = [...parentsDeep, tableName];

      for (const sequenceTable of sequenceTables) {
        await queryInterface.sequelize.query(
          `alter table "${sequenceTable}" alter column id set default nextval('${maxSequenceName}')`,
          {
            transaction,
          },
        );
      }
    }

    if (options.alter) {
      const columns = await queryInterface.describeTable(tableName, options);

      for (const columnName in childAttributes) {
        if (!columns[columnName]) {
          await queryInterface.addColumn(tableName, columnName, childAttributes[columnName], options);
        }
      }
    }
  }

  static async createTable(tableName, attributes, options, model, parentTables) {
    let sql = '';

    options = { ...options };

    if (options && options.uniqueKeys) {
      lodash.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === undefined) {
          uniqueKey.customIndex = true;
        }
      });
    }

    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }

    const queryGenerator = model.queryGenerator;

    attributes = lodash.mapValues(attributes, (attribute) => model.sequelize.normalizeAttribute(attribute));

    attributes = queryGenerator.attributesToSQL(attributes, { table: tableName, context: 'createTable' });

    sql = `${queryGenerator.createTableQuery(tableName, attributes, options)}`.replace(
      ';',
      ` INHERITS (${parentTables.map((t) => `"${t}"`).join(', ')});`,
    );

    return await model.sequelize.query(sql, options);
  }
}
