/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command, Flags } from '@oclif/core';
import { translateCli } from '../../../lib/cli-locale.js';
import { executeSwaggerRequest, swaggerRequestFlags } from '../../../lib/swagger-command.js';
import { renderTable } from '../../../lib/ui.js';

type SwaggerDocument = {
  openapi: string;
  info: {
    title?: string;
    version?: string;
  };
  paths: Record<string, unknown>;
};

const swaggerText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.swagger.${key}`, values, { fallback });

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function unwrapData(value: unknown): unknown {
  if (!isRecord(value) || typeof value.openapi === 'string') {
    return value;
  }
  return Object.prototype.hasOwnProperty.call(value, 'data') ? value.data : value;
}

function normalizeDocument(value: unknown): SwaggerDocument | undefined {
  const document = unwrapData(value);
  if (
    !isRecord(document) ||
    typeof document.openapi !== 'string' ||
    !isRecord(document.info) ||
    !isRecord(document.paths)
  ) {
    return undefined;
  }

  return document as SwaggerDocument;
}

export default class SwaggerGet extends Command {
  static summary = 'Get a NocoBase OpenAPI document';

  static examples = [
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --namespace collections/orders --json',
    '<%= config.bin %> <%= command.id %> --namespace plugins/ai --output ./openapi/ai.json',
  ];

  static flags = {
    ...swaggerRequestFlags,
    namespace: Flags.string({
      aliases: ['ns'],
      description: 'Document namespace, such as core, plugins/ai, or collections/orders',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Write the OpenAPI document to a file',
    }),
    'json-output': Flags.boolean({
      char: 'j',
      aliases: ['json'],
      description: 'Print the complete OpenAPI document as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SwaggerGet);
    const namespace = flags.namespace?.trim() || undefined;
    const response = await executeSwaggerRequest(this, flags, '/swagger:get', { ns: namespace });
    if (!response) {
      return;
    }
    if (!response.ok) {
      const details = JSON.stringify(response.data, null, 2);
      this.error(
        response.status === 404
          ? swaggerText(
              'errors.pluginDisabled',
              undefined,
              'The API documentation plugin is not enabled. Enable it before requesting Swagger documents.',
            )
          : swaggerText(
              'errors.requestFailed',
              { status: response.status, details },
              `Swagger request failed with status ${response.status}\n${details}`,
            ),
      );
    }

    const document = normalizeDocument(response.data);
    if (!document) {
      this.error(
        swaggerText('errors.invalidDocument', undefined, 'swagger:get returned an invalid OpenAPI document.'),
      );
    }

    const json = `${JSON.stringify(document, null, 2)}\n`;
    if (flags.output) {
      const outputPath = path.resolve(flags.output);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, json);
      this.log(
        swaggerText('messages.saved', { output: outputPath }, `Saved Swagger document to ${outputPath}.`),
      );
      return;
    }

    if (flags['json-output']) {
      this.log(json.trimEnd());
      return;
    }

    this.log(
      renderTable(
        [swaggerText('table.field', undefined, 'Field'), swaggerText('table.value', undefined, 'Value')],
        [
          [swaggerText('fields.namespace', undefined, 'Namespace'), namespace ?? 'all'],
          [swaggerText('fields.title', undefined, 'Title'), document.info.title ?? ''],
          [swaggerText('fields.version', undefined, 'Version'), document.info.version ?? ''],
          [swaggerText('fields.openapi', undefined, 'OpenAPI'), document.openapi],
          [swaggerText('fields.paths', undefined, 'Paths'), String(Object.keys(document.paths).length)],
        ],
      ),
    );
  }
}
