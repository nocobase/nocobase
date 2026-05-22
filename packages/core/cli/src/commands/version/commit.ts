/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { executeRawApiRequest } from '../../lib/api-client.js';
import { ensureCrossEnvConfirmed } from '../../lib/env-guard.js';

export default class VersionCommit extends Command {
  static override summary = 'Save the current NocoBase build as a restorable version';

  static override examples = [
    '<%= config.bin %> <%= command.id %> "description here"',
    '<%= config.bin %> <%= command.id %> --env app1 "description here"',
  ];

  static override args = {
    description: Args.string({
      required: true,
      description: 'Commit description, up to 200 characters.',
    }),
  };

  static override flags = {
    'api-base-url': Flags.string({
      description: 'NocoBase API base URL, for example http://localhost:13000/api',
    }),
    env: Flags.string({
      char: 'e',
      description: 'Environment name',
    }),
    role: Flags.string({
      description: 'Role override, sent as X-Role',
    }),
    token: Flags.string({
      char: 't',
      description: 'API key override',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    'json-output': Flags.boolean({
      char: 'j',
      description: 'Print raw JSON response',
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VersionCommit);
    const description = args.description;

    if (description.length > 200) {
      this.error('Description length should not be over 200');
    }

    const confirmed = await ensureCrossEnvConfirmed({
      command: this,
      requestedEnv: flags.env,
      yes: flags.yes,
    });
    if (!confirmed) {
      return;
    }

    const response = await executeRawApiRequest({
      envName: flags.env,
      baseUrl: flags['api-base-url'],
      role: flags.role,
      token: flags.token,
      method: 'POST',
      path: '/app:publishEvent',
      body: {
        plugin: 'plugin-version-control',
        command: 'version:commit',
        payload: {
          description,
        },
      },
    });

    if (!response.ok) {
      this.error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
    }

    if (flags['json-output']) {
      this.log(JSON.stringify(response.data, null, 2));
      return;
    }

    this.log(`HTTP ${response.status}`);
  }
}
