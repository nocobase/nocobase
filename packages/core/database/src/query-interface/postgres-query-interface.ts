import lodash from 'lodash';
import { Collection } from '../collection';
import sqlParser from '../sql-parser/postgres';
import QueryInterface from './query-interface';

export default class PostgresQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
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
            const findAs = from.find((from) => from.as === columnExprTable);

            if (findAs) {
              columnExprTable = findAs.table;
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

  async showTableDefinition(tableInfo: { name: string; schema?: string }) {
    const showFunc = `
CREATE OR REPLACE FUNCTION show_create_table(p_schema text, p_table_name text)
RETURNS text AS
$BODY$
SELECT 'CREATE TABLE ' || p_schema || '.' || p_table_name || ' (' || E'\\n' || '' ||
    string_agg(column_list.column_expr, ', ' || E'\\n' || '') ||
    '' || E'\\n' || ');'
FROM (
  SELECT '    ' || column_name || ' ' || data_type ||
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
      `SELECT show_create_table('${tableInfo.schema}', '${tableInfo.name || 'public'}')`,
      {
        type: 'SELECT',
      },
    );

    return res[0]['show_create_table'];
  }
}
