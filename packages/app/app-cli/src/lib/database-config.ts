import type { OfficialDialect } from '@nocobase/app-server/database';
import { parseDocument } from 'yaml';

/** Default listening ports, used for the connection settings the generated file starts from. */
const PORTS: Readonly<Record<Exclude<OfficialDialect, 'sqlite'>, number>> = {
  postgres: 5432,
  mysql: 3306,
  mssql: 1433,
  oracle: 1521,
  dameng: 5236,
  kingbase: 54321,
  oceanbase: 2881,
};

/**
 * Rewrites the main connection for `dialect`, preserving policies and every other connection.
 *
 * Only `database.connections.main` and `database.default` are touched. An application's other connections are its
 * own — the Examples template's `analytics` is a second SQLite database that has nothing to do with which dialect the
 * main one uses — and the policy keys carry decisions the example made deliberately, so they are read before the
 * connection is replaced and written back afterwards.
 */
export function configureDatabase(
  contents: string,
  dialect: OfficialDialect,
  name: string,
): string {
  const document = parseDocument(contents);
  if (document.errors.length)
    throw new Error(
      `Invalid config.example.yml: ${document.errors[0].message}`,
    );
  const main = ['database', 'connections', 'main'];
  if (
    dialect === 'sqlite' &&
    document.getIn([...main, 'dialect']) === 'sqlite'
  ) {
    if (document.getIn(['database', 'default']) === 'main') return contents;
    document.setIn(['database', 'default'], 'main');
    return document.toString();
  }
  const policyKeys = [
    'schemaManagement',
    'debug',
    'migrations',
    'seeds',
    'metadataStore',
    'naming',
    'internalTables',
  ];
  const policies = policyKeys.map(
    (key) => [key, document.getIn([...main, key], true)] as const,
  );
  const connection: Record<string, unknown> =
    dialect === 'sqlite'
      ? { dialect, database: 'database.sqlite' }
      : {
          dialect,
          host: 'localhost',
          port: PORTS[dialect],
          ...(dialect === 'oracle'
            ? { serviceName: 'FREEPDB1' }
            : dialect === 'dameng'
              ? {}
              : { database: name }),
          username: name,
          password: '',
        };
  if (dialect === 'postgres' || dialect === 'kingbase')
    Object.assign(connection, { schema: 'public', ssl: false });
  if (dialect === 'dameng') connection.schema = name;
  if (dialect === 'mssql')
    Object.assign(connection, { encrypt: true, trustServerCertificate: false });
  Object.assign(connection, { debug: false, schemaManagement: 'managed' });
  document.setIn(main, document.createNode(connection));
  for (const [key, value] of policies)
    if (value !== undefined) document.setIn([...main, key], value);
  document.setIn(['database', 'default'], 'main');
  return document.toString();
}
