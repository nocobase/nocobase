import { InheritedCollection } from './inherited-collection';
import lodash from 'lodash';

export class InheritedModelSyncRunner {
  static async sync(model: any, options: any) {
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

    await this.resetSequence(inheritedCollection, {
      transaction,
      db,
    });

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

  // check table exists or not
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

  // update table inherits option
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

    const shouldRemove = existParents.filter((x) => !newParents.includes(x)).map((x) => db.getCollection(x));
    const shouldAdd = newParents.filter((x) => !existParents.includes(x)).map((x) => db.getCollection(x));

    for (const shouldRemoveItem of shouldRemove) {
      await db.sequelize.query(
        `ALTER TABLE ${collection.quotedTableName()} NO INHERIT ${shouldRemoveItem.quotedTableName()};`,
        {
          transaction,
        },
      );

      await this.resetSequence(shouldRemoveItem, options);
    }

    for (const shouldAddItem of shouldAdd) {
      await this.syncFieldsFromParent(collection, shouldAddItem, options);

      await db.sequelize.query(
        `ALTER TABLE ${collection.quotedTableName()} INHERIT ${shouldAddItem.quotedTableName()};`,
        {
          transaction,
        },
      );
    }
  }

  static async syncFieldsFromParent(childCollection, parentCollection, options) {
    const { db, transaction } = options;

    const parentModel = parentCollection.model;

    const parentAttributes = parentModel.rawAttributes;

    // query child table columns
    const childColumns = await db.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = '${
        childCollection.model.tableName
      }' AND table_schema = '${childCollection.collectionSchema()}';`,
      {
        type: 'SELECT',
        transaction,
      },
    );

    const attributesNotInChild = Object.keys(parentAttributes).filter(
      (attribute) => !childColumns.find((column) => column.column_name === parentAttributes[attribute].field),
    );

    for (const attribute of attributesNotInChild) {
      const attributeDefinition = parentAttributes[attribute];

      if (attributeDefinition.field) {
        await db.sequelize
          .getQueryInterface()
          .addColumn(childCollection.getTableNameWithSchema(), attributeDefinition.field, attributeDefinition, {
            transaction,
          });
      }
    }
  }

  // reset collection sequence
  static async resetSequence(collection, options) {
    const { db, transaction } = options;
    const connectedNodes = db.inheritanceMap.getConnectedNodes(collection.name);
    const connectedCollections = [...connectedNodes].map((node) => db.getCollection(node));
    const connectedCollectionsWithId = connectedCollections.filter(
      (x) => x.model.rawAttributes.id && x.model.rawAttributes.id.autoIncrement,
    );

    const sequenceResults = [];

    for (const connectedCollection of connectedCollectionsWithId) {
      const collectionSequence = await db.sequelize.query(
        `
        SELECT pg_get_serial_sequence('"${connectedCollection.collectionSchema()}"."${
          connectedCollection.model.tableName
        }"', 'id');
      `,
        {
          transaction,
        },
      );

      const maxId = await db.sequelize.query(
        `
        SELECT MAX(id) FROM ${connectedCollection.quotedTableName()};`,
        {
          transaction,
        },
      );

      sequenceResults.push({
        sequence: collectionSequence[0][0]['pg_get_serial_sequence'],
        maxId: maxId[0][0].max,
      });
    }

    const maxId = sequenceResults.reduce((prev, current) => (prev > current.maxId ? prev : current.maxId));
    const rootSequence = sequenceResults[0].sequence;

    // set rootSequence to maxId
    await db.sequelize.query(`alter sequence ${rootSequence} restart with ${maxId + 1}`, {
      transaction,
    });

    // set all connected collection to use same sequence
    for (const connectedCollection of connectedCollectionsWithId) {
      await db.sequelize.query(
        `alter table ${connectedCollection.quotedTableName()}
            alter column id set default nextval('${rootSequence}')`,
        {
          transaction,
        },
      );
    }
  }
}
