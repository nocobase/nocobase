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
  assertPublishFileScope,
  assertPublishRemoteFileSource,
  assertPublishType,
  defaultRemoteFileSource,
  listLocalPublishFiles,
  listRemotePublishFiles,
} from '../../../lib/publish.js';
import { renderTable } from '../../../lib/ui.js';

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

export default class ReleaseFileList extends Command {
  static override summary = 'List local cached files or remote publish files';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --scope local --type backup --env dev',
    '<%= config.bin %> <%= command.id %> --scope remote --type backup --env dev',
    '<%= config.bin %> <%= command.id %> --scope remote --type migration --env dev',
    '<%= config.bin %> <%= command.id %> --scope remote --source artifact --type migration --env test --json',
  ];

  static override flags = {
    scope: Flags.string({
      description: 'Where to list publish files from',
      options: ['local', 'remote'],
      default: 'local',
    }),
    type: Flags.string({
      description: 'Publish file type',
      options: ['backup', 'migration', 'database'],
      required: true,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Environment namespace. For remote scope this selects the remote NocoBase env.',
    }),
    source: Flags.string({
      description:
        'Remote source. Defaults to backup for --type backup, migration for --type migration, and artifact for --type database.',
      options: ['backup', 'migration', 'artifact'],
    }),
    page: Flags.integer({
      description: 'Remote page number',
    }),
    'page-size': Flags.integer({
      description: 'Remote page size',
      default: 20,
    }),
    json: Flags.boolean({
      description: 'Output JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ReleaseFileList);
    const scope = assertPublishFileScope(flags.scope);
    const type = assertPublishType(flags.type);

    if (scope === 'local') {
      const files = await listLocalPublishFiles({
        type,
        env: flags.env,
      });
      if (flags.json) {
        this.log(JSON.stringify({
          scope,
          type,
          env: flags.env,
          files,
        }, null, 2));
        return;
      }

      if (!files.length) {
        this.log(`No local ${type} publish files found${flags.env ? ` for ${flags.env}` : ''}.`);
        return;
      }

      this.log(renderTable(
        ['File', 'Env', 'Size', 'Modified At', 'Uploaded Artifact', 'Path'],
        files.map((file) => [
          file.fileName,
          formatValue(file.env),
          formatValue(file.size),
          formatValue(file.modifiedAt),
          formatValue(file.uploadedArtifactId),
          file.localPath,
        ]),
      ));
      return;
    }

    if (!flags.env) {
      this.error('--env is required when --scope remote is used');
    }

    const source = flags.source ? assertPublishRemoteFileSource(flags.source) : defaultRemoteFileSource(type);
    const files = await listRemotePublishFiles({
      type,
      env: flags.env,
      source,
      page: flags.page,
      pageSize: flags['page-size'],
    });

    if (flags.json) {
      this.log(JSON.stringify({
        scope,
        source,
        type,
        env: flags.env,
        files,
      }, null, 2));
      return;
    }

    if (!files.length) {
      this.log(`No remote ${type} publish files found on ${flags.env} from ${source}.`);
      return;
    }

    this.log(renderTable(
      ['File', 'Source', 'Artifact', 'State', 'Size', 'Created At'],
      files.map((file) => [
        formatValue(file.fileName),
        file.source,
        formatValue(file.artifactId),
        formatValue(file.state || file.status || (file.inProgress ? 'in_progress' : '')),
        formatValue(file.size),
        formatValue(file.createdAt),
      ]),
    ));
  }
}
