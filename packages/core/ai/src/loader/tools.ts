/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { importModule } from '@nocobase/utils';
import { ToolsOptions } from '../tools-manager';
import { DirectoryScanner, DirectoryScannerOptions, FileDescriptor } from './scanner';
import { readFile } from 'fs/promises';
import _ from 'lodash';
import { existsSync } from 'fs';
import { AIManager } from '../ai-manager';
import { LoadAndRegister } from './types';

export type ToolsLoaderOptions = { scan: DirectoryScannerOptions };
export class ToolsLoader extends LoadAndRegister<ToolsLoaderOptions> {
  protected readonly scanner: DirectoryScanner;

  protected files: FileDescriptor[] = [];
  protected toolsDescriptors: ToolsDescriptor[] = [];

  constructor(
    protected readonly ai: AIManager,
    protected readonly options: ToolsLoaderOptions,
  ) {
    super(ai, options);
    this.scanner = new DirectoryScanner(this.options.scan);
  }

  protected async scan(): Promise<void> {
    this.files = await this.scanner.scan();
  }

  protected async import(): Promise<void> {
    if (!this.files.length) {
      return;
    }
    const grouped = new Map<string, FileDescriptor[]>();
    for (const fd of this.files) {
      const key = fd.extname === '.md' || fd.name === 'index' ? fd.directory : fd.name;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(fd);
    }

    this.toolsDescriptors = await Promise.all(
      grouped.entries().map(async ([name, fds]) => {
        const tsFile = fds.find((fd) => fd.extname === '.ts');
        const mdFile = fds.find((fd) => fd.extname === '.md');
        const entry: ToolsDescriptor = { name, tsFile, mdFile };
        if (tsFile && existsSync(tsFile.path)) {
          const module = await importModule(tsFile.path);
          const definition = typeof module === 'function' ? module() : module;
          if (_.isPlainObject(definition)) {
            entry.toolsOptions = _.cloneDeep(definition);
          }
        }
        if (mdFile && existsSync(mdFile.path)) {
          entry.description = await readFile(mdFile.path, 'utf-8');
        }
        return entry;
      }),
    );
  }

  protected async register(): Promise<void> {
    if (!this.toolsDescriptors.length) {
      return;
    }
    const { toolsManager } = this.ai;
    for (const descriptor of this.toolsDescriptors) {
      if (!descriptor.tsFile) {
        throw new Error(`can not find .ts file for tools ${descriptor.name}`);
      }
      if (!descriptor.toolsOptions) {
        throw new Error(`fail to import definition file for tools ${descriptor.name}`);
      }
      const { name, toolsOptions, description } = descriptor;
      toolsOptions.definition.name = name;
      if (!_.isEmpty(description)) {
        toolsOptions.definition.description = description;
      }
      if (toolsManager.getTools(name)) {
        continue;
      }
      toolsManager.registerTools(toolsOptions);
    }
  }
}

export type ToolsDescriptor = {
  name: string;
  tsFile?: FileDescriptor;
  mdFile?: FileDescriptor;
  toolsOptions?: ToolsOptions;
  description?: string;
};
