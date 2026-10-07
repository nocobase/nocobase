import {
  envBoolean,
  envInteger,
  envString,
  type EnvironmentMapping,
} from '@nocobase/config/providers/env';

/**
 * The environment variables that set one connection of the `database` section, with paths relative to it:
 * `<prefix>_DIALECT`, `_HOST`, `_PORT`, `_DATABASE`, `_USERNAME`, `_PASSWORD`, `_SSL` and, for SQLite, `_FILENAME`.
 *
 * The templates declare `DB_*` for `main` alone. An application that adds a connection declares its own with a
 * prefix naming it, such as `connectionEnvironment('analytics', 'DB_ANALYTICS')`. None is required: the connection's
 * code defaults or the configuration file supply whatever the environment leaves out.
 */
export function connectionEnvironment(
  connection: string,
  prefix: string = 'DB',
): Readonly<Record<string, EnvironmentMapping>> {
  const path = (field: string): string => `connections.${connection}.${field}`;
  const about = (what: string): string =>
    `${what} of the ${connection} database connection.`;
  return {
    [`${prefix}_DIALECT`]: envString(path('dialect'), {
      description: `The dialect of the ${connection} database connection, such as sqlite, postgres or mysql; its driver must be installed.`,
      required: false,
    }),
    [`${prefix}_HOST`]: envString(path('host'), {
      description: about('The host'),
      required: false,
    }),
    [`${prefix}_PORT`]: envInteger(path('port'), {
      description: about('The port'),
      required: false,
    }),
    [`${prefix}_DATABASE`]: envString(path('database'), {
      description: about('The database name'),
      required: false,
    }),
    [`${prefix}_USERNAME`]: envString(path('username'), {
      description: about('The user name'),
      required: false,
    }),
    [`${prefix}_PASSWORD`]: envString(path('password'), {
      description: about('The password'),
      secret: true,
      required: false,
    }),
    [`${prefix}_SSL`]: envBoolean(path('ssl'), {
      description: `Whether the ${connection} database connection uses TLS.`,
      required: false,
    }),
    [`${prefix}_FILENAME`]: envString(path('filename'), {
      description: about('The SQLite file'),
      required: false,
    }),
  };
}
