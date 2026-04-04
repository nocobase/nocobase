/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {Command, Flags} from '@oclif/core';
import type {Interfaces} from '@oclif/core';
import {executeApiRequest} from './api-client';
import {applyPostProcessor} from './post-processors';
import {registerPostProcessors} from '../post-processors/index';

export interface GeneratedParameter {
  name: string;
  flagName: string;
  in: 'path' | 'query' | 'header' | 'cookie' | 'body';
  required?: boolean;
  description?: string;
  type?: string;
  isArray?: boolean;
  jsonEncoded?: boolean;
  jsonShape?: string;
}

export interface GeneratedOperation {
  moduleName: string;
  moduleDisplayName?: string;
  moduleDescription?: string;
  resourceName?: string;
  logicalResourceName?: string;
  actionName?: string;
  resourceDisplayName?: string;
  resourceDescription?: string;
  commandId: string;
  method: string;
  pathTemplate: string;
  tags?: string[];
  summary?: string;
  description?: string;
  examples: string[];
  parameters: GeneratedParameter[];
  hasBody?: boolean;
  bodyRequired?: boolean;
}

function buildParameterFlag(parameter: GeneratedParameter) {
  const hints: string[] = [parameter.in];
  if (parameter.type === 'object' || parameter.type === 'array' || parameter.jsonEncoded) {
    hints.push('JSON');
  } else if (parameter.isArray) {
    hints.push('repeatable');
  } else if (parameter.type) {
    hints.push(parameter.type);
  }

  const description = [
    `${parameter.description ?? ''}${parameter.description ? ' ' : ''}[${hints.join(', ')}]`.trim(),
    parameter.jsonShape ? `Shape: ${parameter.jsonShape}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  if (parameter.type === 'boolean') {
    return Flags.boolean({
      description,
      ...(parameter.required ? {required: true as const} : {}),
    });
  }

  if (parameter.isArray && !parameter.jsonEncoded) {
    return Flags.string({
      description,
      multiple: true,
      ...(parameter.required ? {required: true as const} : {}),
    });
  }

  return Flags.string({
    description,
    ...(parameter.required ? {required: true as const} : {}),
  });
}

export function createGeneratedFlags(operation: GeneratedOperation): Interfaces.FlagInput<any> {
  const flags: Interfaces.FlagInput<any> = {
    'base-url': Flags.string({
      description: 'NocoBase API base URL, for example http://localhost:13000/api',
    }),
    profile: Flags.string({
      description: 'Auth profile name',
      default: 'default',
    }),
    token: Flags.string({
      description: 'Bearer token override',
    }),
    'json-output': Flags.boolean({
      description: 'Print raw JSON response',
      default: true,
      allowNo: true,
    }),
  };

  for (const parameter of operation.parameters) {
    flags[parameter.flagName] = buildParameterFlag(parameter);
  }

  if (operation.hasBody) {
    flags.body = Flags.string({
      description: 'JSON request body string',
      required: operation.bodyRequired,
      exclusive: ['body-file'],
    });
    flags['body-file'] = Flags.string({
      description: 'Path to JSON request body file',
      required: false,
      exclusive: ['body'],
    });
  }

  return flags;
}

export abstract class GeneratedApiCommand extends Command {
  static operation: GeneratedOperation;

  async run(): Promise<void> {
    registerPostProcessors();

    const ctor = this.constructor as typeof GeneratedApiCommand;
    const {flags} = await this.parse(ctor);

    const response = await executeApiRequest({
      profile: flags.profile,
      baseUrl: flags['base-url'],
      token: flags.token,
      flags,
      operation: {
        method: ctor.operation.method,
        pathTemplate: ctor.operation.pathTemplate,
        parameters: ctor.operation.parameters,
        hasBody: ctor.operation.hasBody,
        bodyRequired: ctor.operation.bodyRequired,
      },
    });

    if (!response.ok) {
      this.error(`Request failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
    }

    const processedData = await applyPostProcessor(response.data, {
      flags,
      operation: ctor.operation,
    });

    if (flags['json-output']) {
      this.log(JSON.stringify(processedData, null, 2));
      return;
    }

    this.log(`HTTP ${response.status}`);
  }
}
