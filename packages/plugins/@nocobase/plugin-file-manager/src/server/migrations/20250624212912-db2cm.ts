/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.8.0';

  async up() {
    const CollectionRepo = this.db.getRepository('collections') as CollectionRepository;
    await CollectionRepo.db2cm('attachments');
  }
}
