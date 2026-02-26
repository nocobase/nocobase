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
const DOCS_SEARCH_MAX_KEYWORDS = 5;
const DOCS_READ_MAX_PATHS = 3;
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

export async function searchDocsModule(moduleKey: string, keywords: string[], limit = 5) {
  const key = normalizeModuleKey(moduleKey);
  const entry = docsModules.get(key);
  if (!entry) {
    throw new Error(`Document module "${key}" not found.`);
  }

  const { index: flexIndex, fileMap } = await getOrLoadDocsIndex(entry);
  const searchTerms = buildSearchTerms(keywords);
  if (!searchTerms.length) {
    throw new Error('At least one valid keyword is required.');
  }

  const boundedLimit = Math.min(Math.max(limit ?? 5, 1), 20);
  const perKeywordLimit = Math.min(Math.max(boundedLimit * 2, 4), 20);
  const keywordHits = await Promise.all(
    searchTerms.map(async (keyword) =>
      (((await flexIndex.searchAsync(keyword, { limit: perKeywordLimit })) as (string | number)[]) || []).map((id) =>
        String(id),
      ),
    ),
  );

  const aggregate = new Map<string, { score: number; bestRank: number }>();
  for (const hits of keywordHits) {
    for (let i = 0; i < hits.length; i++) {
      const filePath = fileMap[hits[i]];
      if (!filePath) {
        continue;
      }
      const rankScore = perKeywordLimit - i;
      const record = aggregate.get(filePath);
      if (record) {
        record.score += rankScore;
        record.bestRank = Math.min(record.bestRank, i);
      } else {
        aggregate.set(filePath, { score: rankScore, bestRank: i });
      }
    }
  }

  const matches = Array.from(aggregate.entries())
    .sort((a, b) => {
      if (b[1].score !== a[1].score) {
        return b[1].score - a[1].score;
      }
      if (a[1].bestRank !== b[1].bestRank) {
        return a[1].bestRank - b[1].bestRank;
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, boundedLimit)
    .map(([filePath]) => filePath);

  return {
    key,
    keywords: searchTerms,
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
Provide a small keyword list (identifiers, API names, module terms). The tool will search them concurrently with limited parallelism.
Return matching document paths only. ${options.description}`,
      schema: z.object({
        module: z.string().min(1, 'module is required').describe('Module key, e.g. runjs'),
        keywords: z
          .array(z.string().min(1))
          .min(1, 'keywords is required')
          .max(DOCS_SEARCH_MAX_KEYWORDS, `keywords can contain up to ${DOCS_SEARCH_MAX_KEYWORDS} items`)
          .describe('Keywords to search, e.g. ["router", "ctx.state", "runjs"]'),
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
      const keywords = Array.isArray(args?.keywords) ? args.keywords : [];
      const limit = typeof args?.limit === 'number' ? args.limit : undefined;

      if (!moduleKey || !keywords.length) {
        return {
          status: 'error',
          content: `Both module and keywords are required. Available modules: ${available.join(', ')}`,
        };
      }

      try {
        const result = await searchDocsModule(moduleKey, keywords, limit);
        return {
          status: 'success',
          content: JSON.stringify({
            module: result.key,
            keywords: result.keywords,
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
      description:
        'Read files or list directories inside storage/ai/docs using canonical module-based paths. Supports up to 3 paths per call.',
      schema: z.object({
        paths: z
          .array(
            z
              .string()
              .min(1, 'path is required')
              .describe(
                'Canonical path like runjs/context/router/index.md or /runjs/context/router/index.md. No wildcards, relative segments, or globbing.',
              ),
          )
          .min(1, 'paths is required')
          .max(DOCS_READ_MAX_PATHS, `paths can contain up to ${DOCS_READ_MAX_PATHS} items`),
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
      const rawPaths = Array.isArray(args?.paths) ? args.paths : [];
      const paths = Array.from(
        new Set(
          rawPaths
            .map((p) => String(p ?? '').trim())
            .filter((p) => !!p)
            .slice(0, DOCS_READ_MAX_PATHS),
        ),
      );
      if (!paths.length) {
        return {
          status: 'error',
          content: `Paths are required. Available indexes: ${available.join(', ')}`,
        };
      }

      try {
        const entries = await Promise.all(paths.map((targetPath) => readDocEntry(targetPath)));
        const blocks = entries.map((entry) => {
          if (entry.type === 'directory') {
            const listing = entry.entries
              .map((item) => `${item.type === 'directory' ? 'DIR ' : 'FILE'} ${item.path}`)
              .join('\n');
            return `DIRECTORY ${entry.path}\n${listing}`;
          }
          const clean = entry.content.replace(/\r\n/g, '\n');
          return `FILE ${entry.path}\n\`\`\`\n${clean}\n\`\`\``;
        });
        return {
          status: 'success',
          content: blocks.join('\n\n'),
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

function buildSearchTerms(keywords: string[]) {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of keywords) {
    const keyword = String(raw ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!keyword || seen.has(keyword)) {
      continue;
    }
    seen.add(keyword);
    terms.push(keyword);
    if (terms.length >= DOCS_SEARCH_MAX_KEYWORDS) {
      break;
    }
  }
  return terms;
}
