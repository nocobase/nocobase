import lodash from 'lodash';
import { Collection } from '../collection';
import sqlParser from '../sql-parser/postgres';
import QueryInterface, { TableInfo } from './query-interface';
import { Transaction } from 'sequelize';

export default class PostgresQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async setAutoIncrementVal(options: {
    tableInfo: TableInfo;
    columnName: string;
    seqName?: string;
    currentVal?: number;
    transaction?: Transaction;
  }): Promise<void> {
    const { tableInfo, columnName, seqName, currentVal, transaction } = options;

    if (!seqName) {
      throw new Error('seqName is required to set auto increment val in postgres');
    }

    await this.db.sequelize.query(
      `alter table ${this.db.utils.quoteTable({
        tableName: tableInfo.tableName,
        schema: tableInfo.schema,
      })}
            alter column "${columnName}" set default nextval('${seqName}')`,
      {
        transaction,
      },
    );

    if (currentVal) {
      await this.db.sequelize.query(`select setval('${seqName}', ${currentVal})`, {
        transaction,
      });
    }
  }

  async getAutoIncrementInfo(options: {
    tableInfo: TableInfo;
    fieldName: string;
  }): Promise<{ seqName?: string; currentVal: number }> {
    const fieldName = options.fieldName || 'id';
    const tableInfo = options.tableInfo;

    const sequenceNameResult = await this.db.sequelize.query(
      `SELECT column_default
           FROM information_schema.columns
           WHERE table_name = '${tableInfo.tableName}'
             and table_schema = '${tableInfo.schema || 'public'}'
             and "column_name" = '${fieldName}';`,
    );

    const columnDefault = sequenceNameResult[0][0]['column_default'];

    const regex = new RegExp(/nextval\('(.*)'::regclass\)/);
    const match = regex.exec(columnDefault);

    const sequenceName = match[1];

    const sequenceCurrentValResult = await this.db.sequelize.query(
      `select last_value
           from ${sequenceName}`,
    );

    const sequenceCurrentVal = parseInt(sequenceCurrentValResult[0][0]['last_value']);

    return {
      seqName: sequenceName,
      currentVal: sequenceCurrentVal,
    };
  }

  async collectionTableExists(collection: Collection, options?) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;
    const schema = collection.collectionSchema() || 'public';

    const sql = `SELECT EXISTS(SELECT 1
                               FROM information_schema.tables
                               WHERE table_schema = '${schema}'
                                 AND table_name = '${tableName}')`;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    return results[0]['exists'];
  }

  async listViews() {
    const sql = `
      SELECT viewname as name, definition, schemaname as schema
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY viewname;
    `;

    return await this.db.sequelize.query(sql, { type: 'SELECT' });
  }

  async viewDef(viewName: string) {
    const [schema, name] = viewName.split('.');

    const viewDefQuery = await this.db.sequelize.query(
      `
    select pg_get_viewdef(format('%I.%I', '${schema}', '${name}')::regclass, true) as definition
    `,
      { type: 'SELECT' },
    );

    return lodash.trim(viewDefQuery[0]['definition']);
  }

  parseSQL(sql: string): any {
    return sqlParser.parse(sql);
  }

  async viewColumnUsage(options): Promise<{
    [view_column_name: string]: {
      column_name: string;
      table_name: string;
      table_schema?: string;
    };
  }> {
    const { viewName, schema = 'public' } = options;
    const sql = `
      SELECT *
      FROM information_schema.view_column_usage
      WHERE view_schema = '${schema}'
        AND view_name = '${viewName}';
    `;

    const columnUsages = (await this.db.sequelize.query(sql, { type: 'SELECT' })) as Array<{
      column_name: string;
      table_name: string;
      table_schema: string;
    }>;

    const def = await this.viewDef(`${schema}.${viewName}`);

    try {
      const { ast } = this.parseSQL(def);
      const columns = ast[0].columns;

      const usages = columns
        .map((column) => {
          const fieldAlias = column.as || column.expr.column;
          const columnUsage = columnUsages.find((columnUsage) => {
            let columnExprTable = column.expr.table;

            // handle column alias
            const from = ast[0].from;
            if (columnExprTable === null && column.expr.type === 'column_ref') {
              columnExprTable = from[0].table;
            } else {
              const findAs = from.find((from) => from.as === columnExprTable);

              if (findAs) {
                columnExprTable = findAs.table;
              }
            }

            return columnUsage.column_name === column.expr.column && columnUsage.table_name === columnExprTable;
          });

          return [
            fieldAlias,
            columnUsage
              ? {
                  ...columnUsage,
                }
              : null,
          ];
        })
        .filter(([, columnUsage]) => columnUsage !== null);

      return Object.fromEntries(usages);
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  async showTableDefinition(tableInfo: TableInfo): Promise<any> {
    const showFunc = `
CREATE OR REPLACE FUNCTION show_create_table(p_schema text, p_table_name text)
RETURNS text AS
$BODY$
SELECT 'CREATE TABLE ' || quote_ident(p_schema) || '.' || quote_ident(p_table_name) || ' (' || E'\\n' || '' ||
    string_agg(column_list.column_expr, ', ' || E'\\n' || '') ||
    '' || E'\\n' || ');'
FROM (
  SELECT '    ' || quote_ident(column_name) || ' ' || data_type ||
       coalesce('(' || character_maximum_length || ')', '') ||
       case when is_nullable = 'YES' then '' else ' NOT NULL' end as column_expr
  FROM information_schema.columns
  WHERE table_schema = p_schema AND table_name = p_table_name
  ORDER BY ordinal_position) column_list;
$BODY$
  LANGUAGE SQL STABLE;
    `;
    await this.db.sequelize.query(showFunc, { type: 'RAW' });

    const res = await this.db.sequelize.query(
      `SELECT show_create_table('${tableInfo.schema || 'public'}', '${tableInfo.tableName}')`,
      {
        type: 'SELECT',
      },
    );

    return res[0]['show_create_table'];
  }
}
