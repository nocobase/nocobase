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
  checksumFile,
  publishCapabilities,
  publishUpload,
  resolveLocalPublishFile,
  upsertManifestEntry,
} from '../../lib/publish.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';

function getResponseData(response: { ok: boolean; status: number; data: any }) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
  }
  return response.data?.data ?? response.data;
}

export default class PublishCopy extends Command {
  static override summary = 'Upload a local publish file to a target environment staging area';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --type migration --from dev --to test --file <fileName>',
    '<%= config.bin %> <%= command.id %> --type backup --from dev --to test --file <fileName>',
    '<%= config.bin %> <%= command.id %> --type migration --to test --file ./dev-to-test.nbdata',
  ];

  static override flags = {
    type: Flags.string({
      description: 'Publish file type',
      options: ['backup', 'migration', 'database'],
      required: true,
    }),
    from: Flags.string({
      description: 'Source environment namespace for default local lookup',
    }),
    to: Flags.string({
      description: 'Target environment to upload to',
      required: true,
    }),
    file: Flags.string({
      description: 'Local publish file path, or file name under .nocobase/publish/<type>/<from>/',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PublishCopy);
    const type = assertPublishType(flags.type);
    const filePath = resolveLocalPublishFile({
      type,
      file: flags.file,
      sourceEnv: flags.from,
    });
    const fileName = path.basename(filePath);

    startTask(`Uploading ${fileName} to ${flags.to}`);
    try {
      const capabilities = getResponseData(await publishCapabilities({ env: flags.to }));
      assertPublishCapability(capabilities, type, 'upload');

      const checksum = await checksumFile(filePath);
      const uploaded = getResponseData(await publishUpload({
        env: flags.to,
        type,
        sourceEnv: flags.from,
        filePath,
        fileName,
        checksum,
      }));

      await upsertManifestEntry({
        type,
        sourceEnv: flags.from,
        targetEnv: flags.to,
        fileName,
        localPath: filePath,
        checksum,
        uploadedArtifactId: uploaded.artifactId,
        uploadedAt: new Date().toISOString(),
      });

      succeedTask(`Uploaded ${fileName} to ${flags.to}`);
      this.log(`Artifact: ${uploaded.artifactId}`);
      if (uploaded.metadata?.checkResult) {
        this.log(`Check passed: ${uploaded.metadata.checkResult.pass ? 'yes' : 'no'}`);
      }
      if (uploaded.error) {
        this.log(`Warning: ${uploaded.error}`);
      }
    } catch (error: any) {
      failTask('Publish copy failed');
      this.error(error.message);
    }
  }
}
