/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type CommandModuleExtension = '.js' | '.ts';

/**
 * Recursively collect command module paths under `commandsRoot` (e.g. `dist/commands` → `.js`, `src/commands` → `.ts`).
 */
export async function collectCommandModulePaths(
  commandsRoot: string,
  extension: CommandModuleExtension,
): Promise<string[]> {
  const entries = await readdir(commandsRoot, { withFileTypes: true });
  const files: string[] = [];

  for (const ent of entries) {
    const full = join(commandsRoot, ent.name);
    if (ent.isDirectory()) {
      files.push(...(await collectCommandModulePaths(full, extension)));
    } else if (ent.isFile() && ent.name.endsWith(extension)) {
      files.push(full);
    }
  }

  return files.sort();
}

/**
 * Map a path relative to `commands/` with `.js` / `.ts` to an oclif explicit-registry key.
 * `api/resource/foo.js` → `api:resource:foo`; trailing `index` maps to the parent command.
 */
export function commandRelativePathToRegistryKey(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/\.(js|ts)$/i, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.at(-1) === 'index') {
    segments.pop();
  }

  return segments.join(':');
}
