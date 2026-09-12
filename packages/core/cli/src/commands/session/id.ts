/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { resolveSessionIdentity } from '../../lib/session-id.js';

export default class SessionId extends Command {
  static override summary = 'Show the current effective session id';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(SessionId);
    const identity = resolveSessionIdentity();
    if (!identity) {
      this.error('No effective session id is available. Run `nb session setup`, then open a new shell session or runtime.');
    }

    this.log(identity.id);
  }
}
