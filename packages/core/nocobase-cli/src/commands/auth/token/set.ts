/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { upsertTokenProfile } from '../../../lib/auth-store.js';

export default class AuthTokenSet extends Command {
  static summary = 'Save a token-based auth profile';

  static flags = {
    profile: Flags.string({
      description: 'Profile name',
      default: 'default',
    }),
    'base-url': Flags.string({
      description: 'NocoBase API base URL, for example http://localhost:13000/api',
      required: true,
    }),
    token: Flags.string({
      description: 'Bearer token',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthTokenSet);
    await upsertTokenProfile(flags.profile, flags['base-url'], flags.token);
    this.log(`Saved token profile "${flags.profile}"`);
  }
}
