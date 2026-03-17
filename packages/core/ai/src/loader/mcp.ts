/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { importModule } from '@nocobase/utils';
import { existsSync } from 'fs';
import { Logger } from '@nocobase/logger';
import { AIManager } from '../ai-manager';
import { MCPOptions } from '../mcp-manager';
import { LoadAndRegister } from './types';
import { DirectoryScanner, DirectoryScannerOptions, FileDescriptor } from './scanner';
import { isNonEmptyObject } from './utils';

export type MCPLoaderOptions = { scan: DirectoryScannerOptions; log?: Logger };

export class MCPLoader extends LoadAndRegister<MCPLoaderOptions> {
  protected readonly scanner: DirectoryScanner;

  protected files: FileDescriptor[] = [];
  protected mcpDescriptors: MCPDescriptor[] = [];
  protected log: Logger;

  constructor(
    protected readonly ai: AIManager,
    protected readonly options: MCPLoaderOptions,
  ) {
    super(ai, options);
    this.log = options.log;
    this.scanner = new DirectoryScanner(this.options.scan);
  }

  protected async scan(): Promise<void> {
    this.files = await this.scanner.scan();
  }

  protected async import(): Promise<void> {
    if (!this.files.length) {
      return;
    }

    const descriptors = await Promise.all(
      this.files.map(async (file) => {
        const name = file.name;
        if (!existsSync(file.path)) {
          this.log?.error(`mcp [${name}] ignored: can not find definition file at ${file.path}`);
          return null;
        }

        try {
          const imported = await importModule(file.path);
          const mod = imported?.default ?? imported;
          const options = typeof mod === 'function' ? mod() : mod;

          if (!isNonEmptyObject(options)) {
            this.log?.warn(`mcp [${name}] register ignored: invalid definition at ${file.path}`);
            return null;
          }

          return {
            name,
            file,
            options: options as MCPOptions,
          } satisfies MCPDescriptor;
        } catch (e) {
          this.log?.error(`mcp [${name}] load fail: error occur when import ${file.path}`, e);
          return null;
        }
      }),
    );

    this.mcpDescriptors = descriptors.filter((item): item is MCPDescriptor => Boolean(item));
  }

  protected async register(): Promise<void> {
    if (!this.mcpDescriptors.length) {
      return;
    }

    const { mcpManager } = this.ai;
    for (const descriptor of this.mcpDescriptors) {
      try {
        await mcpManager.registerMCP({
          [descriptor.name]: descriptor.options,
        });
      } catch (e) {
        this.log?.error(`mcp [${descriptor.name}] register ignored: error occur when invoke registerMCP`, e);
      }
    }
  }
}

export type MCPDescriptor = {
  name: string;
  file: FileDescriptor;
  options: MCPOptions;
};
