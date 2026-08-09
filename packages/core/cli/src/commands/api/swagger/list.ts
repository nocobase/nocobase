/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { translateCli } from '../../../lib/cli-locale.js';
import { executeSwaggerRequest, swaggerRequestFlags } from '../../../lib/swagger-command.js';
import { renderTable } from '../../../lib/ui.js';

type SwaggerDestination = {
  name: string;
  namespace: string;
  url: string;
};

const swaggerText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.swagger.${key}`, values, { fallback });

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function unwrapData(value: unknown): unknown {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'data') ? value.data : value;
}

function readNamespace(url: string): string {
  try {
    return new URL(url, 'http://localhost').searchParams.get('ns') || 'all';
  } catch {
    return 'all';
  }
}

function normalizeDestinations(value: unknown): SwaggerDestination[] | undefined {
  const data = unwrapData(value);
  if (!Array.isArray(data)) {
    return undefined;
  }

  const destinations: SwaggerDestination[] = [];
  for (const item of data) {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.url !== 'string') {
      return undefined;
    }
    destinations.push({
      name: item.name,
      namespace: readNamespace(item.url),
      url: item.url,
    });
  }
  return destinations;
}

export default class SwaggerList extends Command {
  static summary = 'List available NocoBase OpenAPI document namespaces';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --env dev --yes --json',
  ];

  static flags = {
    ...swaggerRequestFlags,
    'json-output': Flags.boolean({
      char: 'j',
      aliases: ['json'],
      description: 'Print namespaces as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SwaggerList);
    const response = await executeSwaggerRequest(this, flags, '/swagger:getUrls');
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

    const destinations = normalizeDestinations(response.data);
    if (!destinations) {
      this.error(
        swaggerText(
          'errors.invalidDestinations',
          undefined,
          'swagger:getUrls returned an invalid destination list.',
        ),
      );
    }

    if (flags['json-output']) {
      this.log(JSON.stringify(destinations, null, 2));
      return;
    }

    if (!destinations.length) {
      this.log(swaggerText('messages.empty', undefined, 'No Swagger document namespaces are available.'));
      return;
    }

    this.log(
      renderTable(
        [
          swaggerText('table.name', undefined, 'Name'),
          swaggerText('table.namespace', undefined, 'Namespace'),
          swaggerText('table.url', undefined, 'URL'),
        ],
        destinations.map((item) => [item.name, item.namespace, item.url]),
      ),
    );
  }
}
