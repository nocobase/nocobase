/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {promises as fs} from 'node:fs';

export interface ResourceBuildConfig {
  name?: string;
  segments?: string[];
  description?: string;
  topLevel?: boolean;
  operations?: OperationBuildConfigSet;
}

export interface ModuleResourcesConfig {
  includes?: string[];
  excludes?: string[];
  overrides?: Record<string, ResourceBuildConfig>;
}

export interface OperationBuildConfig {
  description?: string;
}

export interface OperationBuildConfigSet {
  includes?: string[];
  excludes?: string[];
  overrides?: Record<string, OperationBuildConfig>;
}

export interface ModuleBuildConfig {
  name?: string;
  description?: string;
  include?: boolean;
  resources?: ModuleResourcesConfig;
}

export interface ModuleGroupConfig {
  match: string[];
  module: string;
}

export interface BuildConfig {
  moduleGroups?: ModuleGroupConfig[];
  modules?: Record<string, ModuleBuildConfig>;
}

export async function loadBuildConfig(filePath: string): Promise<BuildConfig> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as BuildConfig;
  } catch (error) {
    return {};
  }
}
