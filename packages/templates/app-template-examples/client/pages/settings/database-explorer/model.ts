import type {
  CollectionDetail,
  CollectionListResult,
  DatabaseExplorerClient,
} from '@nocobase/app-plugin-database-explorer/client';

type CollectionEntry = CollectionListResult['items'][number];

/** The page's browsing context, all of it in the URL so a refresh, a shared link or Back restores it. */
export const PARAM = {
  connection: 'connection',
  table: 'table',
  tableSearch: 'q',
  fieldSearch: 'fieldQ',
} as const;

/** Server-side maximum page size; every listing is read page by page to the end. */
const PAGE_SIZE = 100;
/** Bounds the walk so a connection that keeps issuing tokens cannot hold the page open forever (10,000 tables). */
const MAX_PAGES = 100;

export interface TableListing {
  readonly items: readonly CollectionEntry[];
  /** More tables exist than the page reads. */
  readonly truncated: boolean;
  /** A later page failed: `items` holds what was read before it. */
  readonly error?: unknown;
}

/**
 * Reads a connection's whole table list, reporting progress per page.
 *
 * Search filters in the browser, which is only honest over the whole list, so
 * a failure after the first page is kept beside what was read instead of being
 * dropped: the page can say the list is incomplete rather than hiding tables.
 */
export async function readTables(
  client: DatabaseExplorerClient,
  connection: string,
  onProgress: (count: number) => void,
): Promise<TableListing> {
  const items: CollectionEntry[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let result;
    try {
      result = await client.collections(connection, {
        pageSize: PAGE_SIZE,
        ...(pageToken === undefined ? {} : { pageToken }),
      });
    } catch (error) {
      if (page === 0) throw error;
      return { items, truncated: false, error };
    }
    items.push(...result.items);
    pageToken = result.nextPageToken;
    if (pageToken === undefined) return { items, truncated: false };
    onProgress(items.length);
  }
  return { items, truncated: true };
}

/** Case-insensitive match of every whitespace-separated term against any of the values. */
export function matches(
  query: string,
  values: readonly (string | undefined)[],
): boolean {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  if (!terms.length) return true;
  const text = values.filter(Boolean).join('\n').toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}

export function tableMatches(query: string, table: CollectionEntry): boolean {
  return matches(query, [table.name, table.tableName, table.title]);
}

type Definition = CollectionDetail['collection']['collection'];
type FieldDefinition = NonNullable<Definition['fields']>[number];

export interface FieldReference {
  readonly collection: string;
  readonly fields?: readonly string[];
  /** The relation type for a relation field; absent for a foreign key constraint. */
  readonly relation?: string;
}

export interface FieldRow {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly type: string;
  /** The column type the database reported, such as `NUMERIC(12,2)`. */
  readonly nativeType?: string;
  /** `undefined` when the definition does not say. */
  readonly nullable?: boolean;
  readonly primaryKey: boolean;
  /** A relation to another table rather than a column of this one, so nullability does not apply. */
  readonly relation: boolean;
  readonly references: readonly FieldReference[];
}

/**
 * Flattens a resolved definition into what the field table shows.
 *
 * Primary and foreign keys are usually declared as table constraints rather
 * than on the field, so both places are read; anything the definition does not
 * state stays `undefined` instead of being guessed.
 */
export function fieldRows(definition: Definition): FieldRow[] {
  const constraints = definition.constraints ?? [];
  const primary = new Set(
    constraints.flatMap((constraint) =>
      constraint.type === 'primary' ? constraint.fields : [],
    ),
  );
  return (definition.fields ?? []).map((field: FieldDefinition) => {
    const references: FieldReference[] = [];
    const relation = 'target' in field && typeof field.target === 'string';
    if (relation)
      references.push({ collection: field.target, relation: field.type });
    for (const constraint of constraints) {
      if (constraint.type !== 'foreignKey') continue;
      const position = constraint.fields.indexOf(field.name);
      if (position === -1) continue;
      const target = constraint.references.fields?.[position];
      references.push({
        collection: constraint.references.collection,
        ...(target === undefined ? {} : { fields: [target] }),
      });
    }
    const nativeType = field.db?.nativeType;
    return {
      name: field.name,
      ...(field.title ? { title: field.title } : {}),
      ...(field.description ? { description: field.description } : {}),
      type: field.type,
      ...(typeof nativeType === 'string' && nativeType ? { nativeType } : {}),
      ...(typeof field.nullable === 'boolean'
        ? { nullable: field.nullable }
        : {}),
      primaryKey: field.primaryKey === true || primary.has(field.name),
      relation,
      references,
    };
  });
}

export function fieldMatches(query: string, field: FieldRow): boolean {
  return matches(query, [
    field.name,
    field.title,
    field.type,
    field.nativeType,
    ...field.references.map((reference) => reference.collection),
  ]);
}

/**
 * Inspection aspects the page does not show. A note that one of them is partial
 * or unsupported says nothing about the fields, keys and references on screen,
 * so it is left out rather than marking every table as possibly incomplete.
 */
const UNSHOWN_ASPECTS: ReadonlySet<string> = new Set([
  'uniqueConstraints',
  'indexes',
  'checkConstraints',
  'comments',
  'viewDefinition',
]);

/** The warnings the server attached to a definition that concern what the page shows, as distinct readable lines. */
export function warningMessages(
  warnings: CollectionDetail['collection']['warnings'],
): string[] {
  return [
    ...new Set(
      warnings
        .filter(
          (warning) =>
            warning.aspect === undefined ||
            !UNSHOWN_ASPECTS.has(warning.aspect),
        )
        .map((warning) => warning.message || warning.code),
    ),
  ];
}

/**
 * Splits an identifier where a line may break: after `_`, `-`, `.` or `/`, and
 * before an upper-case letter that follows a lower-case letter or digit, so a
 * long camelCase or snake_case name wraps between words instead of mid-word.
 */
export function wordBreaks(
  name: string,
): { readonly text: string; readonly start: number }[] {
  const parts: { text: string; start: number }[] = [];
  let start = 0;
  for (const text of name.split(
    /(?<=[_\-./])|(?<=[\p{Ll}\p{Nd}])(?=\p{Lu})/u,
  )) {
    parts.push({ text, start });
    start += text.length;
  }
  return parts;
}
