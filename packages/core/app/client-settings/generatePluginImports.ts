/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { IndexGenerator } from '../../devtools/common.js';

type V2PluginIndexGenerator = new (
  outputPath: string,
  pluginPaths: string[],
  options: {
    clientModuleName: string;
    clientRootFile: string;
    clientSourceDir: string;
  },
) => { generate(): void };

function getPluginDirectories() {
  return (process.env.PLUGIN_PATH || 'packages/plugins/,packages/samples/,packages/pro-plugins/')
    .split(',')
    .map((directory) => path.resolve(process.cwd(), directory));
}

export function generateSettingsPluginImports(outputPath: string, pluginPaths = getPluginDirectories()) {
  const Generator = IndexGenerator as unknown as V2PluginIndexGenerator;
  new Generator(outputPath, pluginPaths, {
    clientModuleName: 'client-v2',
    clientRootFile: 'client-v2.js',
    clientSourceDir: 'client-v2',
  }).generate();
}
