import type { DatabaseConnection } from '@nocobase/db';

export interface AuthorizationRecordOption {
  id: string;
  label: string;
  description?: string;
}

/** The collection metadata a record picker needs, read from db. */
export interface AuthorizationRecordCollection {
  readonly name: string;
  readonly fields: readonly string[];
}

export interface AuthorizationRecordPage {
  readonly items: readonly AuthorizationRecordOption[];
  readonly total: number;
}

export interface AuthorizationAdministration {
  /** One page of a Collection's records, or `undefined` when no Collection of that name exists. */
  listRecords(
    collection: string,
    page: { readonly page: number; readonly pageSize: number },
  ): Promise<AuthorizationRecordPage | undefined>;
}

export interface CreateAuthorizationAdministrationOptions {
  connection?: DatabaseConnection;
  resolveCollection(
    name: string,
  ): Promise<AuthorizationRecordCollection | undefined>;
}

/**
 * Answers the record pickers on the Authorization settings pages, a page at a time. Only Collections db holds can be
 * read, so a name that is none of them answers `undefined` rather than reaching the database.
 */
export function createAuthorizationAdministration(
  options: CreateAuthorizationAdministrationOptions,
): AuthorizationAdministration {
  return {
    async listRecords(
      name: string,
      { page, pageSize }: { readonly page: number; readonly pageSize: number },
    ): Promise<AuthorizationRecordPage | undefined> {
      const { connection } = options;
      const collection = await options.resolveCollection(name);
      if (!collection) return undefined;
      const idField = collection.fields.includes('id')
        ? 'id'
        : collection.fields[0];
      if (!connection || !idField) return { items: [], total: 0 };
      // No API can tell which field a record is recognised by, so the first
      // field that reads like a name is the label.
      const labelField =
        ['title', 'name', 'orderNumber', 'username', 'email'].find((field) =>
          collection.fields.includes(field),
        ) ?? idField;
      const fields = idField === labelField ? [idField] : [idField, labelField];
      const repository = connection.repository(collection.name);
      const [rows, total] = await Promise.all([
        repository.findMany({
          select: (select) => select.fields(...fields),
          sort: (sort) => sort.field(idField).asc(),
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        repository.count(),
      ]);
      return {
        items: rows.map((row) => ({
          id: text(Reflect.get(row, idField)),
          label: text(Reflect.get(row, labelField)),
          ...(labelField === idField
            ? {}
            : { description: text(Reflect.get(row, idField)) }),
        })),
        total,
      };
    },
  };
}

/** A picker shows text, and a column holds whatever its type is. */
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return '';
}
