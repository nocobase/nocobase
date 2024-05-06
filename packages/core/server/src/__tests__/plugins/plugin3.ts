/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../../plugin';

export default class Plugin3 extends Plugin {
  async load() {
    this.app.collection({
      name: 'tests',
    });
  }

  getName(): string {
    return 'Plugin3';
  }
}
