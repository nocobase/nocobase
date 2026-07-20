/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

const VSC_FILE_NAME = 'vsc-file';
const VSC_FILE_PACKAGE = '@nocobase/plugin-vsc-file';
const LIGHT_EXTENSION_NAME = 'light-extension';
const LIGHT_EXTENSION_PACKAGE = '@nocobase/plugin-light-extension';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<2.2.0-beta.16';

  async up() {
    const repository = this.pm.repository;
    const retiredValues = { enabled: false, builtIn: false };

    await repository.update({ filter: { name: VSC_FILE_NAME }, values: retiredValues });
    await repository.update({ filter: { packageName: VSC_FILE_PACKAGE }, values: retiredValues });
    await repository.update({ filter: { name: LIGHT_EXTENSION_NAME }, values: { builtIn: false } });
    await repository.update({ filter: { packageName: LIGHT_EXTENSION_PACKAGE }, values: { builtIn: false } });
  }
}
