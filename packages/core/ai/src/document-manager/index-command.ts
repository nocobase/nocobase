/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, findAllPlugins, PluginManager } from '@nocobase/server';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { Index as FlexSearchIndex } from 'flexsearch';

type DocsCommandOptions = {
  scope?: string | string[];
};

const DOCS_STORAGE_DIR = path.resolve(process.cwd(), 'storage/ai/docs');

export const createDocsIndexCommand = (app: Application) => {
  app
    .command('ai:create-docs-index')
    .option('--scope [scope]', 'Generate docs index for the specified plugin package (comma separated).')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs as [DocsCommandOptions?];
      const scopes = await resolveScopes(opts?.scope);
      if (!scopes.length) {
        app.log.info('No plugin packages detected for docs index generation');
        return;
      }

      for (const scope of scopes) {
        try {
          const { packageName } = await PluginManager.parseName(scope);
          const result = await buildDocsIndex(packageName);
          if (result.created) {
            app.log.info(`Docs index generated for ${packageName}`);
          } else {
            app.log.info(`Skipped docs index for ${packageName}: ${result.reason}`);
          }
        } catch (error) {
          app.log.error(error, { scope });
        }
      }
    });
};

async function resolveScopes(scope?: string | string[]) {
  if (!scope) {
    return await findAllPlugins();
  }
  const scopes = (Array.isArray(scope) ? scope : scope.split(',')).map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set(scopes));
}

interface BuildResult {
  created: boolean;
  reason?: string;
}

async function buildDocsIndex(packageName: string): Promise<BuildResult> {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageDir = path.dirname(packageJsonPath);
  const docsDir = path.join(packageDir, 'src', 'ai-docs');
  const outputDir = path.join(DOCS_STORAGE_DIR, packageName);

  if (!(await fs.pathExists(docsDir))) {
    await fs.remove(outputDir);
    return { created: false, reason: 'docs directory not found' };
  }

  const files = await fg(['**/*.md', '**/*.ts', '**/*.tsx'], {
    cwd: docsDir,
    onlyFiles: true,
    absolute: true,
  });

  if (!files.length) {
    await fs.remove(outputDir);
    return { created: false, reason: 'no doc files found' };
  }

  files.sort();

  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);
  const docsOutputDir = path.join(outputDir, 'docs');

  const index = new FlexSearchIndex();

  const fileMap: Record<number, string> = {};
  let currentId = 1;

  let indexedDocs = 0;
  const markdownExt = new Set(['.md']);

  for (const file of files) {
    const relativePath = path.relative(docsDir, file);
    const normalizedRelativePath = relativePath.split(path.sep).join('/');
    const storageDocPath = path.join(docsOutputDir, relativePath);
    await fs.ensureDir(path.dirname(storageDocPath));
    await fs.copy(file, storageDocPath);

    const ext = path.extname(file).toLowerCase();
    if (!markdownExt.has(ext)) {
      continue;
    }

    const content = await fs.readFile(file, 'utf8');
    if (!content.trim()) {
      continue;
    }

    const docId = currentId++;
    await index.addAsync(docId, content);
    fileMap[docId] = path.posix.join(packageName, normalizedRelativePath);
    indexedDocs++;
  }

  if (!indexedDocs) {
    await fs.remove(outputDir);
    return { created: false, reason: 'no markdown doc content to index' };
  }

  const indexData: Record<string, string> = {};
  index.export((key, data) => {
    indexData[key] = data;
  });

  await fs.ensureDir(outputDir);
  await fs.writeJSON(path.join(outputDir, 'index.json'), indexData, { spaces: 2 });
  await fs.writeJSON(path.join(outputDir, 'files.json'), fileMap, { spaces: 2 });

  return { created: true };
}
