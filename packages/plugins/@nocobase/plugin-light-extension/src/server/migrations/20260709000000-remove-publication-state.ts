/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

type QueryInterfaceLike = {
  tableExists: (table: string) => Promise<boolean>;
  dropTable: (table: string) => Promise<void>;
  describeTable: (table: string) => Promise<Record<string, unknown>>;
  removeColumn: (table: string, column: string) => Promise<void>;
};

export default class RemoveLightExtensionPublicationStateMigration extends Migration {
  on = 'beforeLoad';

  async up() {
    const queryInterface = this.db.sequelize.getQueryInterface() as QueryInterfaceLike;
    await this.removeTableIfExists(queryInterface, 'lightExtensionEntryPublications');
    await this.removeColumnIfExists(queryInterface, 'lightExtensionEntries', 'activePublicationId');
    await this.removeColumnIfExists(queryInterface, 'lightExtensionReferences', 'publicationId');
    await this.removeColumnIfExists(queryInterface, 'lightExtensionReferences', 'versionPolicy');
    await this.removeColumnIfExists(queryInterface, 'lightExtensionRepos', 'lastPublishedAt');
    await this.removeColumnIfExists(queryInterface, 'lightExtensionLogs', 'publicationId');
  }

  async down() {}

  private async removeTableIfExists(queryInterface: QueryInterfaceLike, table: string) {
    if (await queryInterface.tableExists(table)) {
      await queryInterface.dropTable(table);
    }
  }

  private async removeColumnIfExists(queryInterface: QueryInterfaceLike, table: string, column: string) {
    if (!(await queryInterface.tableExists(table))) {
      return;
    }
    const description = await queryInterface.describeTable(table);
    if (Object.prototype.hasOwnProperty.call(description, column)) {
      await queryInterface.removeColumn(table, column);
    }
  }
}
