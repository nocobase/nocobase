import type { CollectionDefinition, DatabaseConnection } from '@nocobase/db';

type ForeignKeyConstraint = Extract<
  NonNullable<CollectionDefinition['constraints']>[number],
  { type: 'foreignKey' }
>;
export type CollectionReferentialAction = NonNullable<
  ForeignKeyConstraint['onDelete']
>;

export interface CollectionFieldSnapshot {
  readonly type: string;
  readonly nullable: boolean;
  /** The declared length of a string Field, where the database reports one. */
  readonly length?: number;
}

/** An index or unique constraint, by the Fields it covers; physical names are left out. */
export interface CollectionIndexSnapshot {
  readonly fields: readonly string[];
  readonly unique: boolean;
}

export interface CollectionForeignKeySnapshot {
  readonly fields: readonly string[];
  readonly collection: string;
  readonly referencedFields: readonly string[];
  readonly onDelete?: CollectionReferentialAction;
  readonly onUpdate?: CollectionReferentialAction;
}

/**
 * The physical schema behind a Collection in logical terms: Field and
 * Collection names rather than columns and tables, and no index or
 * constraint names. Those differ between dialects — truncation, case
 * folding, generated names — while what a migration means does not.
 */
export interface CollectionSchemaSnapshot {
  readonly name: string;
  /** Column-backed Fields by name; relation Fields are represented by their foreign keys. */
  readonly fields: Readonly<Record<string, CollectionFieldSnapshot>>;
  readonly primaryKey: readonly string[];
  readonly indexes: readonly CollectionIndexSnapshot[];
  readonly foreignKeys: readonly CollectionForeignKeySnapshot[];
}

const RELATION_TYPES = new Set([
  'belongsTo',
  'hasOne',
  'hasMany',
  'belongsToMany',
]);

/**
 * Reads the physical schema of a Collection through the connection's
 * inspector, resolved back to Field names. Returns `undefined` when its table
 * does not exist.
 */
export async function inspectCollection(
  connection: DatabaseConnection,
  name: string,
): Promise<CollectionSchemaSnapshot | undefined> {
  connection.collections.invalidate(name);
  const resolution = await connection.collections.getResolution(name);
  if (!resolution) return undefined;
  const { collection } = resolution;
  const fields: Record<string, CollectionFieldSnapshot> = {};
  for (const field of collection.fields ?? []) {
    if (RELATION_TYPES.has(field.type)) continue;
    fields[field.name] = {
      type: field.type,
      nullable: field.nullable ?? true,
      ...(field.length === undefined ? {} : { length: field.length }),
    };
  }
  let primaryKey: readonly string[] = [];
  const indexes: CollectionIndexSnapshot[] = [];
  const foreignKeys: CollectionForeignKeySnapshot[] = [];
  const addIndex = (indexFields: readonly string[], unique: boolean): void => {
    const known = indexes.some(
      (index) =>
        index.unique === unique && sameFields(index.fields, indexFields),
    );
    if (!known) indexes.push({ fields: [...indexFields], unique });
  };
  for (const constraint of collection.constraints ?? []) {
    if (constraint.type === 'primary') primaryKey = [...constraint.fields];
    if (constraint.type === 'unique') addIndex(constraint.fields, true);
    if (constraint.type === 'foreignKey') {
      foreignKeys.push({
        fields: [...constraint.fields],
        collection: constraint.references.collection,
        referencedFields: [...(constraint.references.fields ?? [])],
        ...(constraint.onDelete ? { onDelete: constraint.onDelete } : {}),
        ...(constraint.onUpdate ? { onUpdate: constraint.onUpdate } : {}),
      });
    }
  }
  for (const index of collection.indexes ?? []) {
    if (!index.fields) continue;
    addIndex(index.fields, index.db?.unique === true);
  }
  // Some databases report the index behind the primary key as a unique index or constraint of its own; it is
  // already described by `primaryKey`, and reporting it twice would make the snapshot differ by dialect.
  const secondaryIndexes = indexes.filter(
    (index) => !(index.unique && sameFields(index.fields, primaryKey)),
  );
  return {
    name,
    fields,
    primaryKey,
    indexes: secondaryIndexes,
    foreignKeys,
  };
}

function sameFields(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((field, index) => field === right[index])
  );
}
