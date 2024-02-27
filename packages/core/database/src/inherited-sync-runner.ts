import { InheritedCollection } from './inherited-collection';
import lodash from 'lodash';

export class InheritedSyncRunner {
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

    for (const parent of parents) {
      if (Object.keys(parent.model.rawAttributes).length === 0) {
        throw new Error(
          `can't inherit from collection ${parent.options.name} because it has no attributes, please define at least one attribute in parent collection`,
        );
      }
    }
    const tableName = inheritedCollection.getTableNameWithSchema();
    const attributes = model.tableAttributes;

    const childAttributes = lodash.pickBy(attributes, (value) => {
      return !value.inherit;
    });

    if (
      !(await inheritedCollection.existsInDb({
        transaction,
      }))
    ) {
      let maxSequenceVal = 0;
      let maxSequenceName;

      // find max sequence
      if (childAttributes.id && childAttributes.id.autoIncrement) {
        for (const parent of parents) {
          const sequenceNameResult = await queryInterface.sequelize.query(
            `SELECT column_default
           FROM information_schema.columns
           WHERE table_name = '${parent.model.tableName}'
             and table_schema = '${parent.collectionSchema()}'
             and "column_name" = 'id';`,
            {
              transaction,
            },
          );

          if (!sequenceNameResult[0].length) {
            continue;
          }

          const columnDefault = sequenceNameResult[0][0]['column_default'];

          if (!columnDefault) {
            throw new Error(`Can't find sequence name of parent collection ${parent.options.name}`);
          }

          const regex = new RegExp(/nextval\('(.*)'::regclass\)/);
          const match = regex.exec(columnDefault);

          const sequenceName = match[1];
          const sequenceCurrentValResult = await queryInterface.sequelize.query(
            `select last_value
           from ${sequenceName}`,
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

      await this.createTable(tableName, childAttributes, options, model, parents);

      // if we have max sequence, set it to child table
      if (maxSequenceName) {
        const parentsDeep = Array.from(db.inheritanceMap.getParents(inheritedCollection.name)).map((parent) =>
          db.getCollection(parent).getTableNameWithSchema(),
        );

        const sequenceTables = [...parentsDeep, tableName];

        for (const sequenceTable of sequenceTables) {
          const tableName = sequenceTable.tableName;
          const schemaName = sequenceTable.schema;

          const idColumnSql = `SELECT column_name
           FROM information_schema.columns
           WHERE table_name = '${tableName}'
             and column_name = 'id'
             and table_schema = '${schemaName}';
          `;

          const idColumnQuery = await queryInterface.sequelize.query(idColumnSql, {
            transaction,
          });

          if (idColumnQuery[0].length == 0) {
            continue;
          }

          await queryInterface.sequelize.query(
            `alter table ${db.utils.quoteTable(sequenceTable)}
            alter column id set default nextval('${maxSequenceName}')`,
            {
              transaction,
            },
          );
        }
      }
    }

    if (options.alter) {
      const columns = await queryInterface.describeTable(tableName, options);

      for (const attribute in childAttributes) {
        const columnName = childAttributes[attribute].field;

        if (!columns[columnName]) {
          await queryInterface.addColumn(tableName, columnName, childAttributes[columnName], options);
        }
      }
    }
  }

  static async createTable(tableName, attributes, options, model, parents) {
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
      ` INHERITS (${parents
        .map((t) => {
          return t.getTableNameWithSchema();
        })
        .join(', ')});`,
    );

    return await model.sequelize.query(sql, options);
  }
}
