/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import path from 'node:path';
import {
  assertPublishCapability,
  assertPublishType,
  findManifestEntry,
  publishCapabilities,
  publishExecute,
} from '../../lib/publish.js';
import { confirmAction, failTask, startTask, succeedTask } from '../../lib/ui.js';

function getResponseData(response: { ok: boolean; status: number; data: any }) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
  }
  return response.data?.data ?? response.data;
}

export default class PublishExecute extends Command {
  static override summary = 'Execute a staged publish file on a target environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --type migration --env test --file <fileName> --wait',
    '<%= config.bin %> <%= command.id %> --type backup --env test --file <fileName> --yes --wait',
    '<%= config.bin %> <%= command.id %> --type backup --env test --artifact <artifactId> --skip-revert-on-error --yes',
    '<%= config.bin %> <%= command.id %> --type migration --env test --artifact <artifactId>',
  ];

  static override flags = {
    type: Flags.string({
      description: 'Publish file type',
      options: ['backup', 'migration', 'database'],
      required: true,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Target environment to execute on',
      required: true,
    }),
    file: Flags.string({
      description: 'File name previously uploaded by `nb publish copy`',
    }),
    artifact: Flags.string({
      description: 'Server-side staged artifact ID. Use this when local manifest is unavailable.',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm destructive execution without prompting',
      default: false,
    }),
    wait: Flags.boolean({
      description: 'Wait for execution to finish. The MVP API returns after execution completes.',
      default: false,
    }),
    'skip-backup': Flags.boolean({
      description: 'Skip backup before migration execution',
      default: false,
    }),
    'no-backup-before-execute': Flags.boolean({
      description: 'Skip target backup before backup restore execution',
      default: false,
    }),
    'skip-revert-on-error': Flags.boolean({
      description: 'Do not try to revert a failed backup restore',
      default: false,
    }),
    var: Flags.string({
      description: 'Environment variable text for migration execution',
      multiple: true,
      required: false,
    }),
    secret: Flags.string({
      description: 'Secret environment variable text for migration execution',
      multiple: true,
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PublishExecute);
    const type = assertPublishType(flags.type);

    if (!flags.artifact && !flags.file) {
      this.error('Provide either --artifact or --file');
    }

    let artifactId = flags.artifact;
    if (!artifactId && flags.file) {
      const fileName = path.basename(flags.file);
      const entry = await findManifestEntry({
        type,
        fileName,
        targetEnv: flags.env,
      });
      artifactId = entry?.uploadedArtifactId;
      if (!artifactId) {
        this.error(`No uploaded artifact found for ${fileName} on ${flags.env}. Run \`nb publish copy\` first or use --artifact.`);
      }
    }

    if (!flags.yes) {
      const ok = await confirmAction(`Execute ${type} artifact ${artifactId} on ${flags.env}? This may change data.`, {
        defaultValue: false,
      });
      if (!ok) {
        this.log('Cancelled.');
        return;
      }
    }

    const envTexts = [
      ...((flags.var || []) as string[]).map((text) => ({ text, secret: false })),
      ...((flags.secret || []) as string[]).map((text) => ({ text, secret: true })),
    ];

    startTask(`Executing ${type} artifact on ${flags.env}`);
    try {
      const capabilities = getResponseData(await publishCapabilities({ env: flags.env }));
      assertPublishCapability(capabilities, type, 'execute');

      const executed = getResponseData(await publishExecute({
        env: flags.env,
        type,
        artifactId,
        skipBackup: flags['skip-backup'],
        backupBeforeExecute: !flags['no-backup-before-execute'],
        skipRevertOnError: flags['skip-revert-on-error'],
        envTexts,
      }));

      succeedTask(`Executed ${executed.fileName || artifactId}`);
      this.log(`State: ${executed.state}`);
      if (executed.result) {
        this.log(JSON.stringify(executed.result, null, 2));
      }
      if (executed.error) {
        this.log(`Error: ${executed.error}`);
      }
    } catch (error: any) {
      failTask('Publish execute failed');
      this.error(error.message);
    }
  }
}
