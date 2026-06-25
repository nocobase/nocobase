/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';

export type TemplateContext = Record<string, string>;

const TEMPLATE_EXTENSION = '.tpl';
const TEMPLATE_TOKEN_PATTERN = /\{\{\{\s*([a-zA-Z0-9_]+)\s*\}\}\}/g;

function renderTemplateString(source: string, context: TemplateContext): string {
  return source.replace(TEMPLATE_TOKEN_PATTERN, (_match, rawKey: string) => {
    const key = String(rawKey).trim();
    const value = context[key];
    if (value === undefined) {
      throw new Error(`Missing scaffold template value for "${key}".`);
    }
    return value;
  });
}

async function renderTemplateFile(params: {
  sourcePath: string;
  targetPath: string;
  context: TemplateContext;
}): Promise<void> {
  const outputPath = params.targetPath.endsWith(TEMPLATE_EXTENSION)
    ? params.targetPath.slice(0, -TEMPLATE_EXTENSION.length)
    : params.targetPath;

  await fsp.mkdir(path.dirname(outputPath), { recursive: true });

  if (params.sourcePath.endsWith(TEMPLATE_EXTENSION)) {
    const source = await fsp.readFile(params.sourcePath, 'utf8');
    const rendered = renderTemplateString(source, params.context);
    await fsp.writeFile(outputPath, rendered, 'utf8');
    return;
  }

  await fsp.copyFile(params.sourcePath, outputPath);
}

async function copyTemplateDirectory(params: {
  sourcePath: string;
  targetPath: string;
  context: TemplateContext;
}): Promise<void> {
  await fsp.mkdir(params.targetPath, { recursive: true });
  const entries = await fsp.readdir(params.sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(params.sourcePath, entry.name);
    const targetEntryPath = path.join(params.targetPath, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateDirectory({
        sourcePath: sourceEntryPath,
        targetPath: targetEntryPath,
        context: params.context,
      });
      continue;
    }

    if (entry.isFile()) {
      await renderTemplateFile({
        sourcePath: sourceEntryPath,
        targetPath: targetEntryPath,
        context: params.context,
      });
    }
  }
}

export async function renderTemplateDirectory(params: {
  templateRoot: string;
  targetRoot: string;
  context: TemplateContext;
}): Promise<void> {
  await copyTemplateDirectory({
    sourcePath: params.templateRoot,
    targetPath: params.targetRoot,
    context: params.context,
  });
}
