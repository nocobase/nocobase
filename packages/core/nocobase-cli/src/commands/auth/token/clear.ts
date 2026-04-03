/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { clearProfile } from '../../../lib/auth-store.js';

export default class AuthTokenClear extends Command {
  static summary = 'Remove a saved auth profile';

  static flags = {
    profile: Flags.string({
      description: 'Profile name',
      default: 'default',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthTokenClear);
    await clearProfile(flags.profile);
    this.log(`Cleared profile "${flags.profile}"`);
  }
}
