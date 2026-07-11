/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Migration } from '@nocobase/server';

interface IndexFieldDescription {
  attribute?: string;
  name?: string;
}

interface IndexDescription {
  name?: string;
  fields?: Array<IndexFieldDescription | string>;
}

const LEGACY_PUBLICATION_COLUMNS = ['publishedCommitId', 'published_commit_id'] as const;

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const db = this.context.db;
    const queryInterface = db.sequelize.getQueryInterface();
    const refsTable = db.getCollection('vscFileRefs').getTableNameWithSchema();
    const repositoriesTable = db.getCollection('vscFileRepositories').getTableNameWithSchema();

    if (await queryInterface.tableExists(refsTable)) {
      await queryInterface.bulkDelete(refsTable, { name: 'published' });
    }

    if (!(await queryInterface.tableExists(repositoriesTable))) {
      return;
    }

    const columns = await queryInterface.describeTable(repositoriesTable);
    const publicationColumns = LEGACY_PUBLICATION_COLUMNS.filter((column) => columns[column]);
    if (!publicationColumns.length) {
      return;
    }

    const indexes = (await queryInterface.showIndex(repositoriesTable)) as IndexDescription[];
    for (const index of indexes) {
      if (!index.name || !index.fields?.some(isPublishedCommitIdIndexField)) {
        continue;
      }
      await queryInterface.removeIndex(repositoriesTable, index.name);
    }

    for (const publicationColumn of publicationColumns) {
      await queryInterface.removeColumn(repositoriesTable, publicationColumn);
    }
  }
}

function isPublishedCommitIdIndexField(field: IndexFieldDescription | string): boolean {
  if (typeof field === 'string') {
    return LEGACY_PUBLICATION_COLUMNS.includes(field as (typeof LEGACY_PUBLICATION_COLUMNS)[number]);
  }

  return [field.attribute, field.name].some(
    (value) =>
      typeof value === 'string' &&
      LEGACY_PUBLICATION_COLUMNS.includes(value as (typeof LEGACY_PUBLICATION_COLUMNS)[number]),
  );
}
