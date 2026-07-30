/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stat } from 'node:fs/promises';
import path from 'node:path';

export const PORTAL_CONFIG_FILE = 'portal.config.json';

export type PortalWorkspaceResolutionMode = 'create' | 'pull' | 'existing';

export type PortalWorkspaceResolutionOptions = {
  portal: string;
  directory?: string;
  cwd?: string;
  mode: PortalWorkspaceResolutionMode;
};

export async function isPortalWorkspace(directory: string): Promise<boolean> {
  try {
    return (await stat(path.join(directory, PORTAL_CONFIG_FILE))).isFile();
  } catch {
    return false;
  }
}

export async function resolvePortalWorkspaceDirectory(options: PortalWorkspaceResolutionOptions): Promise<string> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (options.directory) {
    return path.resolve(cwd, options.directory);
  }
  if (options.mode === 'existing' || (options.mode === 'pull' && (await isPortalWorkspace(cwd)))) {
    return cwd;
  }
  return path.join(cwd, options.portal);
}
