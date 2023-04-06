import { InheritedCollection } from './inherited-collection';
import lodash from 'lodash';

export class SyncRunner {
  static async syncInheritModel(model: any, options: any) {
    const { transaction } = options;

    const inheritedCollection = model.collection as InheritedCollection;
    const db = inheritedCollection.context.database;

    const dialect = db.sequelize.getDialect();

    if (dialect != 'postgres') {
      throw new Error('Inherit model is only supported on postgres');
    }

    console.log(`run sync inherit model ${inheritedCollection.name}`);

    const queryInterface = db.sequelize.getQueryInterface();

    const parents = inheritedCollection.parents;

    if (!parents) {
      throw new Error(
        `Inherit model ${
          inheritedCollection.name
        } can't be created without parents collections, parents option is ${lodash
          .castArray(inheritedCollection.options.inherits)
          .join(', ')}`,
      );
    }

    const tableName = inheritedCollection.getTableNameWithSchema();

    const attributes = model.tableAttributes;

    const childAttributes = lodash.pickBy(attributes, (value) => {
      return !value.inherit;
    });

    const tableExists = await this.tableExists(tableName, db, transaction);

    if (tableExists) {
      await this.updateInherits(inheritedCollection, {
        transaction,
        db,
      });
    } else {
      await this.createTable(tableName, childAttributes, options, model, parents);
    }

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
          throw new Error(`Can't find sequence name of ${parent}`);
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

  static async tableExists(tableName, db, transaction) {
    const sql = `
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE  table_schema = '${tableName.schema}'
        AND    table_name   = '${tableName.tableName}'
    );
    `;

    const result = await db.sequelize.query(sql, { type: 'SELECT', transaction });
    return result[0].exists;
  }

  static async updateInherits(collection, options) {
    const { db, transaction } = options;

    const querySql = `
        SELECT child_schema.nspname  AS child_schema,
               child_table.relname   AS child_table,
               parent_schema.nspname AS parent_schema,
               parent_table.relname  AS parent_table
        FROM pg_inherits
               JOIN pg_class child_table ON child_table.oid = pg_inherits.inhrelid
               JOIN pg_class parent_table ON parent_table.oid = pg_inherits.inhparent
               JOIN pg_namespace child_schema ON child_schema.oid = child_table.relnamespace
               JOIN pg_namespace parent_schema ON parent_schema.oid = parent_table.relnamespace
        WHERE child_schema.nspname = '${collection.collectionSchema()}'
          AND child_table.relname = '${collection.model.tableName}';
      `;

    const queryRes = await db.sequelize.query(querySql, {
      type: 'SELECT',
    });

    const existParents = queryRes.map((row) => {
      return row.parent_table;
    });

    const newParents = collection.options.inherits;

    const shouldRemove = existParents.filter((x) => !newParents.includes(x));
    const shouldAdd = newParents.filter((x) => !existParents.includes(x));

    for (const shouldRemoveItem of shouldRemove) {
      await db.sequelize.query(
        `ALTER TABLE ${db.utils.quoteTable(collection.getTableNameWithSchema())} NO INHERIT ${shouldRemoveItem};`,
        {
          transaction,
        },
      );
    }

    for (const shouldAddItem of shouldAdd) {
      await db.sequelize.query(
        `ALTER TABLE ${db.utils.quoteTable(collection.getTableNameWithSchema())} INHERIT ${shouldAddItem};`,
        { transaction },
      );
    }
  }
}
