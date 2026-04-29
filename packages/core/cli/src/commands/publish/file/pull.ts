/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  assertPublishRemoteFileSource,
  assertPublishType,
  defaultRemoteFileSource,
  downloadRemotePublishFile,
} from '../../../lib/publish.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class PublishFilePull extends Command {
  static override summary = 'Download a remote publish file into the global CLI publish workspace';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --type backup --env dev --file <backupFileName>',
    '<%= config.bin %> <%= command.id %> --type migration --env dev --file <migrationFileName>',
    '<%= config.bin %> <%= command.id %> --type migration --env test --source artifact --artifact <artifactId>',
    '<%= config.bin %> <%= command.id %> --type backup --env dev --file <backupFileName> --output ./dev.nbdata',
  ];

  static override flags = {
    type: Flags.string({
      description: 'Publish file type',
      options: ['backup', 'migration', 'database'],
      required: true,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Remote NocoBase environment to download from',
      required: true,
    }),
    source: Flags.string({
      description:
        'Remote source. Defaults to backup for --type backup, migration for --type migration, and artifact for --type database.',
      options: ['backup', 'migration', 'artifact'],
    }),
    file: Flags.string({
      description: 'Remote file name to download',
    }),
    artifact: Flags.string({
      description: 'Remote publish artifact ID, used with --source artifact',
    }),
    output: Flags.string({
      description: 'Local output path. Defaults to the global CLI home publish workspace.',
    }),
    json: Flags.boolean({
      description: 'Output JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PublishFilePull);
    const type = assertPublishType(flags.type);
    const source = flags.source ? assertPublishRemoteFileSource(flags.source) : defaultRemoteFileSource(type);

    if (source === 'artifact' && !flags.file && !flags.artifact) {
      this.error('Provide --artifact or --file when --source artifact is used');
    }
    if (source !== 'artifact' && !flags.file) {
      this.error('Provide --file to download from backup or migration source');
    }

    startTask(`Downloading ${type} publish file from ${flags.env}`);
    try {
      const downloaded = await downloadRemotePublishFile({
        env: flags.env,
        type,
        source,
        fileName: flags.file,
        artifactId: flags.artifact,
        outputPath: flags.output,
      });

      succeedTask(`Downloaded ${downloaded.fileName}`);
      if (flags.json) {
        this.log(JSON.stringify(downloaded, null, 2));
        return;
      }

      this.log(`Local file: ${downloaded.localPath}`);
      this.log(`Checksum: ${downloaded.checksum}`);
    } catch (error: any) {
      failTask('Publish file pull failed');
      this.error(error.message);
    }
  }
}

