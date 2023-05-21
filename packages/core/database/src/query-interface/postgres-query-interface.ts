import QueryInterface from './query-interface';
import { Collection } from '../collection';
import sqlParser from '../sql-parser/postgres';

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

    const viewDefQuery = await this.db.sequelize.query(
      `
    select pg_get_viewdef(format('%I.%I', '${schema}', '${viewName}')::regclass, true) as definition
    `,
      { type: 'SELECT' },
    );

    const def = viewDefQuery[0]['definition'];
    try {
      const { ast } = sqlParser.parse(def);
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
      this.db.logger.warn(e);
      return {};
    }
  }
}
