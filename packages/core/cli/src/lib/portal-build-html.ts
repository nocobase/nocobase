/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BUILD_HTML_SCRIPT_PATH = path.join('scripts', 'build-html.mjs');
const BUILD_HTML_ENV_FILES_PATTERN =
  /return\s+\[\s*["']\.env["']\s*,\s*["']\.env\.local["']\s*,\s*`\.env\.\$\{mode\}`\s*,\s*`\.env\.\$\{mode\}\.local`\s*\]\.map\(\s*\(?file\)?\s*=>\s*path\.join\(rootDir,\s*file\)\s*\);/m;
const BUILD_HTML_ENV_ONLY_REPLACEMENT = 'return [".env.server.prod"].map((file) => path.join(rootDir, file));';

export async function ensurePortalBuildHtmlReadsEnvOnly(portalDir: string): Promise<void> {
  const scriptPath = path.join(portalDir, BUILD_HTML_SCRIPT_PATH);
  let content: string;
  try {
    content = await readFile(scriptPath, 'utf-8');
  } catch {
    return;
  }

  const nextContent = content.replace(BUILD_HTML_ENV_FILES_PATTERN, BUILD_HTML_ENV_ONLY_REPLACEMENT);
  if (nextContent !== content) {
    await writeFile(scriptPath, nextContent, 'utf-8');
  }
}
