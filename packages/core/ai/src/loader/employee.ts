/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { importModule } from '@nocobase/utils';
import { DirectoryScanner, DirectoryScannerOptions, FileDescriptor } from './scanner';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { AIManager } from '../ai-manager';
import { LoadAndRegister } from './types';
import { Logger } from '@nocobase/logger';
import path from 'path';
import { AIEmployeeOptions, AIEmployeeToolSetting } from '../ai-employee-manager';

export type AIEmployeeLoaderOptions = { scan: DirectoryScannerOptions; log?: Logger };

export class AIEmployeeLoader extends LoadAndRegister<AIEmployeeLoaderOptions> {
  protected readonly scanner: DirectoryScanner;

  protected files: FileDescriptor[] = [];
  protected employeeDescriptors: AIEmployeeDescriptor[] = [];
  protected log: Logger;

  constructor(
    protected readonly ai: AIManager,
    protected readonly options: AIEmployeeLoaderOptions,
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

    const grouped = new Map<string, FileDescriptor[]>();
    for (const fd of this.files) {
      const employeeRoot = getEmployeeRoot(fd);
      const group = grouped.get(employeeRoot) ?? [];
      group.push(fd);
      grouped.set(employeeRoot, group);
    }

    const descriptors = await Promise.all(
      Array.from(grouped.entries()).map(async ([employeeRoot, fds]) => {
        const file = fds.find((fd) => fd.extname === '.ts' || fd.extname === '.js');
        if (!file || !existsSync(file.path)) {
          return null;
        }
        const promptFile = fds.find((fd) => fd.basename === 'prompt.md');

        const name = path.basename(employeeRoot);
        try {
          const imported = await importModule(file.path);
          const mod = imported?.default ?? imported;
          const employeeOptions = typeof mod === 'function' ? mod() : mod;
          if (!employeeOptions || !employeeOptions.username) {
            this.log?.warn(`ai employee [${name}] register ignored: invalid definition at ${file.path}`);
            return null;
          }
          const { skills = [], tools = [] } = employeeOptions;

          if (promptFile && existsSync(promptFile.path)) {
            try {
              employeeOptions.systemPrompt = await readFile(promptFile.path, 'utf-8');
            } catch (e) {
              this.log?.error(
                `ai employee [${name}] load fail: error occur when reading prompt.md at ${promptFile.path}`,
                e,
              );
              return null;
            }
          }

          return {
            name,
            employeeRoot,
            file,
            options: {
              ...employeeOptions,
              skills: [...skills, ...(await discoverSkills(employeeRoot))],
              tools: [...tools, ...(await discoverTools(employeeRoot))],
            } as AIEmployeeOptions,
          } satisfies AIEmployeeDescriptor;
        } catch (e) {
          this.log?.error(`ai employee [${name}] load fail: error occur when import ${file.path}`, e);
          return null;
        }
      }),
    );

    this.employeeDescriptors = descriptors.filter((item): item is AIEmployeeDescriptor => Boolean(item));
  }

  protected async register(): Promise<void> {
    if (!this.employeeDescriptors.length) {
      return;
    }
    const { employeeManager } = this.ai;
    for (const descriptor of this.employeeDescriptors) {
      await employeeManager.registerEmployee(descriptor.options);
    }
  }
}

export type AIEmployeeDescriptor = {
  name: string;
  employeeRoot: string;
  file: FileDescriptor;
  options: AIEmployeeOptions;
};

function getEmployeeRoot(fd: FileDescriptor) {
  if (fd.basename === 'index.ts' || fd.basename === 'index.js' || fd.basename === 'prompt.md') {
    return path.dirname(fd.path);
  }
  return fd.path;
}

async function discoverSkills(employeeRoot: string): Promise<string[]> {
  const skillsDir = path.join(employeeRoot, 'skills');
  if (!existsSync(skillsDir)) {
    return [];
  }
  const scanner = new DirectoryScanner({
    basePath: employeeRoot,
    pattern: ['skills/**/SKILLS.md'],
  });
  const skillFiles = await scanner.scan();
  return uniq(skillFiles.map((it) => it.directory).filter(Boolean));
}

async function discoverTools(employeeRoot: string): Promise<AIEmployeeToolSetting[]> {
  const toolsDir = path.join(employeeRoot, 'tools');
  if (!existsSync(toolsDir)) {
    return [];
  }
  const scanner = new DirectoryScanner({
    basePath: employeeRoot,
    pattern: ['tools/**/*.ts', 'tools/**/*.js', '!tools/**/*.d.ts'],
  });
  const toolFiles = await scanner.scan();
  return uniqBy(
    toolFiles
      .map((it) =>
        normalizeAIEmployeeToolSetting(
          it.basename === 'index.ts' || it.basename === 'index.js' ? it.directory : it.name,
        ),
      )
      .filter((tool): tool is AIEmployeeToolSetting => Boolean(tool?.name)),
    'name',
  );
}

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function uniqBy<T extends Record<string, unknown>>(values: T[], key: keyof T) {
  const valueMap = new Map<unknown, T>();
  for (const value of values) {
    valueMap.set(value[key], value);
  }
  return [...valueMap.values()];
}

export function normalizeAIEmployeeToolSetting(
  tool?: string | AIEmployeeToolSetting,
): AIEmployeeToolSetting | undefined {
  if (!tool) {
    return;
  }
  if (typeof tool === 'string') {
    return { name: tool };
  }
  if (!tool.name) {
    return;
  }
  return {
    name: tool.name,
    ...(tool.autoCall != null ? { autoCall: tool.autoCall } : {}),
  };
}
