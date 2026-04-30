/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  defaultPublishDir,
  getPublishResponseData,
  publishCapabilities,
  publishDownload,
  publishGenerate,
  upsertManifestEntry,
} from '../../lib/publish.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';

export default class ReleaseGenerate extends Command {
  static override summary = 'Generate a publish file on an environment and download it locally';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --type migration --env dev --migration-rule <ruleId> --wait',
    '<%= config.bin %> <%= command.id %> --type backup --env dev --wait',
    '<%= config.bin %> <%= command.id %> --type migration --env dev --migration-rule <ruleId> --output ./dev-to-test.nbdata --wait',
  ];

  static override flags = {
    type: Flags.string({
      description: 'Publish file type',
      options: ['backup', 'migration', 'database'],
      required: true,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Source environment that generates the publish file',
      required: true,
    }),
    rule: Flags.string({
      description: 'Migration rule ID when --type migration is used. Kept as a compatibility alias for --migration-rule.',
    }),
    'migration-rule': Flags.string({
      description: 'Migration rule ID when --type migration is used',
    }),
    title: Flags.string({
      description: 'Migration title when --type migration is used',
    }),
    output: Flags.string({
      description: 'Local output path. Defaults to the global CLI home publish workspace.',
    }),
    wait: Flags.boolean({
      description: 'Wait for generation to finish. The MVP API returns after generation completes.',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ReleaseGenerate);
    const type = assertPublishType(flags.type);
    const migrationRuleId = flags['migration-rule'] || flags.rule;

    if (type === 'migration' && !migrationRuleId) {
      this.error('--migration-rule is required when --type migration is used');
    }

    startTask(`Generating ${type} publish file on ${flags.env}`);
    try {
      const capabilities = getPublishResponseData(await publishCapabilities({ env: flags.env }));
      assertPublishCapability(capabilities, type, 'generate');

      const generated = getPublishResponseData(await publishGenerate({
        env: flags.env,
        type,
        ruleId: migrationRuleId,
        title: flags.title,
      }));
      const outputPath = flags.output
        ? path.resolve(process.cwd(), flags.output)
        : path.join(defaultPublishDir(type, flags.env), generated.fileName);

      const downloaded = getPublishResponseData(await publishDownload({
        env: flags.env,
        type,
        artifactId: generated.artifactId,
        outputPath,
      }));

      await upsertManifestEntry({
        type,
        sourceEnv: flags.env,
        fileName: path.basename(outputPath),
        localPath: outputPath,
        checksum: downloaded.checksum || generated.checksum,
      });

      succeedTask(`Generated and downloaded ${generated.fileName}`);
      this.log(`Local file: ${outputPath}`);
      this.log(`Artifact: ${generated.artifactId}`);
    } catch (error: any) {
      failTask('Release generate failed');
      this.error(error.message);
    }
  }
}
