/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, CollectionOptions, Database, Field, Transaction } from '@nocobase/database';
import { Migration } from '@nocobase/server';

import lightExtensionReferencesCollection from '../collections/lightExtensionReferences';
import lightExtensionReposCollection from '../collections/lightExtensionRepos';

const repoReferenceConstraintName = 'light_extension_references_repo_id_fk';

interface ConstraintDescription {
  constraintName?: string;
  constraint_name?: string;
  constraintType?: string;
  type?: string;
  columnName?: string;
  columnNames?: string[];
  referencedTableName?: string;
  referencedTable?: string;
  referencedTableSchema?: string;
  referencedColumnName?: string;
}

export default class AddReferenceRepoForeignKeyMigration extends Migration {
  on = 'beforeLoad';

  async up() {
    const queryInterface = this.db.sequelize.getQueryInterface();
    const managedCollections = [
      ensureCollection(this.db, lightExtensionReposCollection),
      ensureCollection(this.db, lightExtensionReferencesCollection),
    ];
    const reposCollection = managedCollections[0].collection;
    const referencesCollection = managedCollections[1].collection;

    try {
      const referencesTable = referencesCollection.getTableNameWithSchema();
      const reposTable = reposCollection.getTableNameWithSchema();
      const repoIdColumn = getColumnName(referencesCollection, 'repoId');
      const reposIdColumn = getColumnName(reposCollection, 'id');
      const referencesTableExists = await queryInterface.tableExists(referencesTable);
      const reposTableExists = await queryInterface.tableExists(reposTable);

      if (!referencesTableExists || !reposTableExists) {
        return;
      }

      const transaction = await this.db.sequelize.transaction();

      try {
        for (const constraintName of await this.findExistingRepoReferenceConstraints(
          referencesCollection,
          reposCollection,
          repoIdColumn,
        )) {
          await queryInterface.removeConstraint(referencesTable, constraintName, { transaction });
        }

        await this.deleteOrphanReferences({
          transaction,
          referencesTable,
          reposTable,
          repoIdColumn,
          reposIdColumn,
        });
        await queryInterface.addConstraint(referencesTable, {
          name: repoReferenceConstraintName,
          type: 'foreign key',
          fields: [repoIdColumn],
          references: {
            table: reposTable,
            field: reposIdColumn,
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
          transaction,
        });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } finally {
      removeTemporaryCollections(this.db, managedCollections);
    }
  }

  async down() {}

  private async findExistingRepoReferenceConstraints(
    referencesCollection: Collection,
    reposCollection: Collection,
    repoIdColumn: string,
  ): Promise<string[]> {
    const queryInterface = this.db.sequelize.getQueryInterface();
    const constraints = (await queryInterface.getForeignKeyReferencesForTable(
      referencesCollection.getTableNameWithSchema(),
    )) as ConstraintDescription[];
    const referencedTableNames = getTableNameCandidates(reposCollection);
    const reposIdColumn = getColumnName(reposCollection, 'id');

    return constraints
      .filter((constraint) => {
        const columnNames = constraint.columnNames || (constraint.columnName ? [constraint.columnName] : []);
        const referencedTableName = constraint.referencedTableName || constraint.referencedTable;
        const referencedColumnName = constraint.referencedColumnName || reposIdColumn;

        return (
          columnNames.includes(repoIdColumn) &&
          typeof referencedTableName === 'string' &&
          referencedTableNames.has(referencedTableName) &&
          referencedColumnName === reposIdColumn
        );
      })
      .map((constraint) => constraint.constraintName || constraint.constraint_name)
      .filter((constraintName): constraintName is string => Boolean(constraintName));
  }

  private async deleteOrphanReferences(options: {
    transaction: Transaction;
    referencesTable: Collection['model']['tableName'] | ReturnType<Collection['getTableNameWithSchema']>;
    reposTable: Collection['model']['tableName'] | ReturnType<Collection['getTableNameWithSchema']>;
    repoIdColumn: string;
    reposIdColumn: string;
  }) {
    const quotedReferencesTable = this.db.utils.quoteTable(options.referencesTable);
    const quotedReposTable = this.db.utils.quoteTable(options.reposTable);
    const quotedRepoId = this.db.quoteIdentifier(options.repoIdColumn);
    const quotedId = this.db.quoteIdentifier(options.reposIdColumn);

    await this.db.sequelize.query(
      `
        DELETE FROM ${quotedReferencesTable}
        WHERE ${quotedRepoId} IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM ${quotedReposTable}
            WHERE ${quotedReposTable}.${quotedId} = ${quotedReferencesTable}.${quotedRepoId}
          )
      `,
      { transaction: options.transaction },
    );
  }
}

function ensureCollection(
  db: Database,
  collectionOptions: CollectionOptions,
): { collection: Collection; temporary: boolean } {
  const existing = db.getCollection(collectionOptions.name);
  if (existing) {
    return {
      collection: existing,
      temporary: false,
    };
  }

  return {
    collection: db.collection(collectionOptions),
    temporary: true,
  };
}

function removeTemporaryCollections(
  db: Database,
  collections: Array<{ collection: Collection; temporary: boolean }>,
): void {
  for (const managedCollection of [...collections].reverse()) {
    if (managedCollection.temporary) {
      db.removeCollection(managedCollection.collection.name);
    }
  }
}

function getColumnName(collection: Collection, fieldName: string): string {
  const field = collection.getField(fieldName) as Field | undefined;

  return field?.columnName() || fieldName;
}

function getTableNameCandidates(collection: Collection): Set<string> {
  const candidates = new Set<string>();
  candidates.add(collection.model.tableName);
  candidates.add(collection.tableNameAsString());
  candidates.add(collection.tableNameAsString({ ignorePublicSchema: true }));

  return candidates;
}
