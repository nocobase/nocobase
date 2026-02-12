/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { Index as FlexSearchIndex } from 'flexsearch';
import { ToolsOptions } from '@nocobase/ai';

const DEFAULT_DOCS_DIR = path.resolve(process.cwd(), 'storage/ai/docs');

type DocsIndexMeta = {
  key: string;
  description?: string;
  docsDir: string;
  indexFile: string;
  filesMapFile: string;
};

export type DocEntryResult =
  | {
      type: 'file';
      path: string;
      content: string;
    }
  | {
      type: 'directory';
      path: string;
      entries: Array<{ name: string; type: 'file' | 'directory'; path: string }>;
    };

const docsModules = new Map<string, DocsIndexMeta>();
let docsBaseDir = DEFAULT_DOCS_DIR;
let docsMeta: Record<string, { description?: string }> = {};
const DOCS_INDEX_TTL_MS = 5 * 60 * 1000;
const DOCS_INDEX_MAX_CACHE = 5;
const docsIndexCache = new Map<
  string,
  {
    index: FlexSearchIndex;
    fileMap: Record<string, string>;
    lastAccess: number;
  }
>();
const docsIndexLoading = new Map<string, Promise<{ index: FlexSearchIndex; fileMap: Record<string, string> }>>();

export async function loadDocsIndexes(baseDir = DEFAULT_DOCS_DIR) {
  docsBaseDir = baseDir;
  docsModules.clear();
  docsMeta = {};
  docsIndexCache.clear();
  docsIndexLoading.clear();
  const exists = await fs.pathExists(docsBaseDir);
  if (!exists) {
    return;
  }

  const metaPath = path.join(docsBaseDir, 'meta.json');
  if (await fs.pathExists(metaPath)) {
    try {
      const meta = await fs.readJson(metaPath);
      if (meta && typeof meta === 'object') {
        docsMeta = meta as Record<string, { description?: string }>;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[docs-tools] Failed to read docs meta', { metaPath, error });
    }
  }

  const indexFiles = await fg('**/index.json', { cwd: docsBaseDir, onlyFiles: true, absolute: true });
  for (const indexFile of indexFiles) {
    const pluginDir = path.dirname(indexFile);
    const filesPath = path.join(pluginDir, 'files.json');
    const docsDir = pluginDir;

    try {
      const [filesExists, docsExists] = await Promise.all([fs.pathExists(filesPath), fs.pathExists(docsDir)]);
      if (!filesExists || !docsExists) {
        continue;
      }

      const relativeKey = path.relative(docsBaseDir, pluginDir).split(path.sep).join('/');
      if (!relativeKey) {
        continue;
      }

      const description = docsMeta?.[relativeKey]?.description?.trim() || '';

      docsModules.set(relativeKey, {
        key: relativeKey,
        description,
        docsDir: path.resolve(docsDir),
        indexFile,
        filesMapFile: filesPath,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[docs-tools] Failed to load docs index metadata', { indexFile, error });
    }
  }
}

export function getDocModuleKeys() {
  return Array.from(docsModules.keys()).sort();
}

export function describeDocModules(emptyMessage = 'No document modules available.') {
  const keys = getDocModuleKeys();
  if (!keys.length) {
    return emptyMessage;
  }
  const items = keys.map((key) => {
    const desc = docsModules.get(key)?.description;
    return desc ? `${key} (${desc})` : key;
  });
  return `Available modules: ${items.join(', ')}`;
}

export async function searchDocsModule(moduleKey: string, query: string, limit = 5) {
  const key = normalizeModuleKey(moduleKey);
  const entry = docsModules.get(key);
  if (!entry) {
    throw new Error(`Document module "${key}" not found.`);
  }

  const { index: flexIndex, fileMap } = await getOrLoadDocsIndex(entry);

  const boundedLimit = Math.min(Math.max(limit ?? 5, 1), 20);
  const hits = ((await flexIndex.searchAsync(query, { limit: boundedLimit })) as (string | number)[]) || [];
  const seen = new Set<string>();
  const matches: string[] = [];
  for (const hit of hits) {
    const filePath = fileMap[String(hit)];
    if (filePath && !seen.has(filePath)) {
      seen.add(filePath);
      matches.push(filePath);
    }
  }

  return {
    key,
    matches,
  };
}

export async function readDocEntry(docPath: string): Promise<DocEntryResult> {
  const resolved = resolveDocPath(docPath);
  if (!(await fs.pathExists(resolved.absolutePath))) {
    throw new Error(`Path "${resolved.canonicalPath}" does not exist.`);
  }

  const stat = await fs.stat(resolved.absolutePath);
  if (stat.isDirectory()) {
    const names = await fs.readdir(resolved.absolutePath);
    const entries = await Promise.all(
      names.sort().map(async (name) => {
        const absoluteChild = path.join(resolved.absolutePath, name);
        const childStat = await fs.stat(absoluteChild);
        const relativeChild = path.relative(resolved.meta.docsDir, absoluteChild).split(path.sep).join('/');
        const childPath = relativeChild ? `${resolved.meta.key}/${relativeChild}` : resolved.meta.key;
        const entryType: 'file' | 'directory' = childStat.isDirectory() ? 'directory' : 'file';
        return {
          name,
          type: entryType,
          path: childPath,
        };
      }),
    );
    return {
      type: 'directory',
      path: resolved.canonicalPath,
      entries,
    };
  }

  if (!stat.isFile()) {
    throw new Error(`Path "${resolved.canonicalPath}" is not a regular file.`);
  }

  const content = await fs.readFile(resolved.absolutePath, 'utf8');
  return {
    type: 'file',
    path: resolved.canonicalPath,
    content,
  };
}

export function createDocsSearchTool(options?: { description?: string }): ToolsOptions {
  return {
    scope: 'GENERAL',
    defaultPermission: 'ALLOW',
    introduction: {
      title: '{{t("Search documentation")}}',
      about: '{{t("Search docs tool description")}}',
    },
    definition: {
      name: 'searchDocs',
      description: `Search indexed documentation using a FlexSearch-based keyword index.
The index is built from module identifiers (e.g. "runjs") and English technical terms.
Use concise, exact keywords (module names, API names, identifiers). Avoid natural language queries or vague wording.
Return matching document paths only. ${options.description}`,
      schema: z.object({
        module: z.string().min(1, 'module is required').describe('Module key, e.g. runjs'),
        query: z.string().min(1, 'query is required').describe('Search keyword or phrase in English'),
        limit: z.number().int().min(1).max(20).optional().describe('Maximum number of hits (default 5, max 20)'),
      }),
    },
    invoke: async (ctx, args) => {
      const available = getDocModuleKeys();
      if (!available.length) {
        return {
          status: 'error',
          content: 'No document indexes available.',
        };
      }

      const moduleKey = args?.module?.trim();
      const query = args?.query?.trim();
      const limit = typeof args?.limit === 'number' ? args.limit : undefined;

      if (!moduleKey || !query) {
        return {
          status: 'error',
          content: `Both module and query are required. Available modules: ${available.join(', ')}`,
        };
      }

      try {
        const result = await searchDocsModule(moduleKey, query, limit);
        return {
          status: 'success',
          content: JSON.stringify({
            module: result.key,
            matches: result.matches,
            availableModules: available,
          }),
        };
      } catch (error) {
        ctx.log?.error?.(error, {
          module: 'ai',
          subModule: 'toolCalling',
          toolName: 'searchDocs',
        });
        return {
          status: 'error',
          content: `Failed to search docs: ${error.message}`,
        };
      }
    },
  };
}

export function createReadDocEntryTool(): ToolsOptions {
  return {
    scope: 'GENERAL',
    defaultPermission: 'ALLOW',
    introduction: {
      title: '{{t("Read documentation file")}}',
      about: '{{t("Read docs tool description")}}',
    },
    definition: {
      name: 'readDocEntry',
      description: 'Read files or list directories inside storage/ai/docs using canonical module-based paths.',
      schema: z.object({
        path: z
          .string()
          .min(1, 'path is required')
          .describe(
            'Canonical path like runjs/context/router/index.md or /runjs/context/router/index.md. No wildcards, relative segments, or globbing.',
          ),
      }),
    },
    invoke: async (ctx, args) => {
      const available = getDocModuleKeys();
      const targetPath = args?.path?.trim();
      if (!targetPath) {
        return {
          status: 'error',
          content: `Path is required. Available indexes: ${available.join(', ')}`,
        };
      }

      try {
        const entry = await readDocEntry(targetPath);
        if (entry.type === 'directory') {
          const listing = entry.entries
            .map((item) => `${item.type === 'directory' ? 'DIR ' : 'FILE'} ${item.path}`)
            .join('\n');
          return {
            status: 'success',
            content: `DIRECTORY ${entry.path}\n${listing}`,
          };
        }

        const clean = entry.content.replace(/\r\n/g, '\n');
        return {
          status: 'success',
          content: `FILE ${entry.path}\n\`\`\`\n${clean}\n\`\`\``,
        };
      } catch (error) {
        ctx.log?.error?.(error, {
          module: 'ai',
          subModule: 'toolCalling',
          toolName: 'readDocEntry',
        });
        return {
          status: 'error',
          content: `Failed to read docs entry: ${error.message}`,
        };
      }
    },
  };
}

function normalizeModuleKey(input: string) {
  const { pluginKey, relativePath } = parseDocPath(input);
  if (relativePath) {
    throw new Error('Index key should only contain the module key, e.g. runjs.');
  }
  return pluginKey;
}

function resolveDocPath(input: string) {
  const { pluginKey, relativePath, canonicalPath } = parseDocPath(input);
  const meta = docsModules.get(pluginKey);
  if (!meta) {
    throw new Error(`Document module "${pluginKey}" not found.`);
  }
  const safeRelative = relativePath || '';
  const absolutePath = path.resolve(meta.docsDir, safeRelative);
  if (!absolutePath.startsWith(meta.docsDir)) {
    throw new Error('Access denied for the requested path.');
  }

  return {
    meta,
    absolutePath,
    canonicalPath,
  };
}

function parseDocPath(input: string) {
  const segments = normalizeDocInput(input);
  let pluginKey: string;
  let relativeStart = 0;

  if (segments[0].startsWith('@')) {
    if (segments.length < 2) {
      throw new Error('Missing package name segment in the path.');
    }
    pluginKey = `${segments[0]}/${segments[1]}`;
    relativeStart = 2;
  } else {
    pluginKey = segments[0];
    relativeStart = 1;
  }

  const relativeSegments = segments.slice(relativeStart);
  const relativePath = relativeSegments.join('/');
  const canonicalPath = relativePath ? `${pluginKey}/${relativePath}` : pluginKey;

  return {
    pluginKey,
    relativePath,
    canonicalPath,
  };
}

function normalizeDocInput(input: string) {
  let value = (input ?? '').trim();
  if (!value) {
    throw new Error('Path is required.');
  }

  value = value.replace(/\\/g, '/');
  value = value.replace(/^\/+/, '');
  if (value.startsWith('storage/ai/docs/')) {
    value = value.slice('storage/ai/docs/'.length);
  }
  if (!value) {
    throw new Error('Path is required.');
  }

  const rawSegments = value.split('/');
  const segments: string[] = [];
  for (const raw of rawSegments) {
    const segment = raw.trim();
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      throw new Error('Relative segments are not allowed in document paths.');
    }
    if (segment.includes('*')) {
      throw new Error('Wildcards are not allowed in document paths.');
    }
    segments.push(segment);
  }

  if (!segments.length) {
    throw new Error('Path is required.');
  }

  return segments;
}

async function getOrLoadDocsIndex(entry: DocsIndexMeta) {
  const now = Date.now();
  const cached = docsIndexCache.get(entry.key);
  if (cached && now - cached.lastAccess <= DOCS_INDEX_TTL_MS) {
    cached.lastAccess = now;
    return cached;
  }

  const loading = docsIndexLoading.get(entry.key);
  if (loading) {
    const result = await loading;
    docsIndexCache.set(entry.key, { ...result, lastAccess: Date.now() });
    return docsIndexCache.get(entry.key);
  }

  const loadPromise = (async () => {
    const [indexData, fileMap] = await Promise.all([fs.readJSON(entry.indexFile), fs.readJSON(entry.filesMapFile)]);
    const flexIndex = new FlexSearchIndex();
    Object.entries(indexData).forEach(([importKey, data]) => {
      if (typeof data === 'string') {
        flexIndex.import(importKey, data);
      }
    });
    return { index: flexIndex, fileMap };
  })();

  docsIndexLoading.set(entry.key, loadPromise);
  try {
    const result = await loadPromise;
    docsIndexCache.set(entry.key, { ...result, lastAccess: Date.now() });
    enforceDocsIndexCacheLimit();
    return docsIndexCache.get(entry.key);
  } finally {
    docsIndexLoading.delete(entry.key);
  }
}

function enforceDocsIndexCacheLimit() {
  if (docsIndexCache.size <= DOCS_INDEX_MAX_CACHE) {
    return;
  }
  const entries = Array.from(docsIndexCache.entries()).sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  const overflow = entries.length - DOCS_INDEX_MAX_CACHE;
  for (let i = 0; i < overflow; i++) {
    docsIndexCache.delete(entries[i][0]);
  }
}
