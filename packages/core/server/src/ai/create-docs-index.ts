/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { FlexSearchIndex } from '@nocobase/ai';
import type Application from '../application';
import { findAllPlugins } from '../plugin-manager/findPackageNames';
import { PluginManager } from '../plugin-manager';

export type DocsIndexOptions = {
  pkg?: string | string[];
};

interface BuildResult {
  created: boolean;
  reason?: string;
  conflicts?: string[];
}

type DirectoryChildren = Map<
  string,
  {
    files: string[];
    directories: string[];
  }
>;

const DOCS_STORAGE_DIR = path.resolve(process.cwd(), 'storage/ai/docs');
const REFERENCE_START = '<!-- docs:references:start -->';
const REFERENCE_END = '<!-- docs:references:end -->';
const SPLIT_REFERENCE_START = '<!-- docs:splits:start -->';
const SPLIT_REFERENCE_END = '<!-- docs:splits:end -->';
const SPLIT_MAX_LENGTH = 5000;
const SPLIT_MAX_CODE_BLOCKS = 3;
const CREATE_INDEX_RETRY_MAX = 3;
const CREATE_INDEX_RETRY_DELAY_MS = 200;

interface DocEntryMeta {
  absolutePath: string;
  relativePath: string;
  canonicalPath: string;
  content: string;
  title: string;
  description: string;
  hasFrontMatter: boolean;
  isIndex: boolean;
  moduleName: string;
  moduleRoot: string;
  packageName: string;
}

interface ModuleGroup {
  moduleName: string;
  description: string;
  moduleRoot: string;
  packageName: string;
  entries: DocEntryMeta[];
  directoryChildren: DirectoryChildren;
  docMap: Map<string, DocEntryMeta>;
}

interface ModuleMeta {
  module?: string;
  description?: string;
  source?: string;
}

type ModuleMetaEntry = ModuleMeta & {
  module: string;
  description?: string;
  source?: string;
};

function normalizeMetaEntries(meta: ModuleMeta | ModuleMeta[] | null, fallbackModule: string) {
  if (Array.isArray(meta)) {
    return meta
      .filter((item) => item && typeof item.module === 'string')
      .map((item) => ({
        module: item.module.trim(),
        description: typeof item.description === 'string' ? item.description.trim() : '',
        source: typeof item.source === 'string' ? item.source.trim() : '',
      }))
      .filter((item) => item.module);
  }
  if (meta && typeof meta.module === 'string') {
    return [
      {
        module: meta.module.trim() || fallbackModule,
        description: typeof meta.description === 'string' ? meta.description.trim() : '',
        source: typeof meta.source === 'string' ? meta.source.trim() : '',
      },
    ];
  }
  return [
    {
      module: fallbackModule,
      description: '',
      source: '',
    },
  ];
}

async function resolvePkgs(pkg?: string | string[]) {
  if (!pkg) {
    return await findAllPlugins();
  }
  const scopes = (Array.isArray(pkg) ? pkg : pkg.split(',')).map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set(scopes));
}

function buildDirectoryChildren(files: string[], docsDir: string): DirectoryChildren {
  const map: DirectoryChildren = new Map();
  const ensureDir = (dir: string) => {
    if (!map.has(dir)) {
      map.set(dir, { files: [], directories: [] });
    }
  };

  ensureDir(docsDir);

  files.forEach((file) => {
    const dir = path.dirname(file);
    ensureDir(dir);
    map.get(dir)?.files.push(file);
  });

  files.forEach((file) => {
    let current = path.dirname(file);
    while (current && current.startsWith(docsDir)) {
      const parent = path.dirname(current);
      if (parent && parent.startsWith(docsDir)) {
        ensureDir(parent);
        const list = map.get(parent);
        if (list && !list.directories.includes(current)) {
          list.directories.push(current);
        }
      }
      if (current === docsDir) break;
      current = path.dirname(current);
    }
  });

  return map;
}

async function resolveSourcePath(source: string, metaFile: string) {
  if (!source) return '';
  if (path.isAbsolute(source)) {
    return (await fs.pathExists(source)) ? source : '';
  }
  const fromRepo = path.resolve(process.cwd(), source);
  if (await fs.pathExists(fromRepo)) {
    return fromRepo;
  }
  const fromMeta = path.resolve(path.dirname(metaFile), source);
  if (await fs.pathExists(fromMeta)) {
    return fromMeta;
  }
  return '';
}

function errorToString(error: unknown) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return String(error);
}

async function collectModuleGroups(packageName: string): Promise<ModuleGroup[]> {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageDir = path.dirname(packageJsonPath);
  const distDocsDir = path.join(packageDir, 'dist', 'ai', 'docs');
  const srcDocsDir = path.join(packageDir, 'src', 'ai', 'docs');
  const preferSrc = process.env.APP_ENV !== 'production';
  const preferredDocsDir = preferSrc ? srcDocsDir : distDocsDir;
  const fallbackDocsDir = preferSrc ? distDocsDir : srcDocsDir;
  const docsDir = (await fs.pathExists(preferredDocsDir)) ? preferredDocsDir : fallbackDocsDir;

  if (!(await fs.pathExists(docsDir))) {
    return [];
  }

  const rootMetaPath = path.join(docsDir, 'meta.json');
  let metaEntries: ModuleMetaEntry[] = [];
  if (await fs.pathExists(rootMetaPath)) {
    try {
      const rootMeta = (await fs.readJson(rootMetaPath)) as ModuleMeta | ModuleMeta[];
      metaEntries = normalizeMetaEntries(rootMeta, path.basename(docsDir));
    } catch {
      metaEntries = [];
    }
  }

  const moduleMetaFiles =
    metaEntries.length === 0
      ? await fg(['*/meta.json'], {
          cwd: docsDir,
          onlyFiles: true,
          absolute: true,
        })
      : [];

  if (!metaEntries.length && !moduleMetaFiles.length) {
    return [];
  }

  moduleMetaFiles.sort();
  const moduleRoots = moduleMetaFiles.map((metaPath) => path.dirname(metaPath));

  const groups: ModuleGroup[] = [];
  const entriesToProcess =
    metaEntries.length > 0
      ? metaEntries.map((entry) => ({ metaFile: rootMetaPath, entry }))
      : moduleMetaFiles.map((metaFile) => ({ metaFile, entry: undefined as ModuleMetaEntry | undefined }));

  for (const item of entriesToProcess) {
    const metaFile = item.metaFile;
    const moduleRoot = path.dirname(metaFile);
    const moduleDirName = path.basename(moduleRoot);
    let perFileEntries: ModuleMetaEntry[] = [];

    if (item.entry) {
      perFileEntries = [item.entry];
    } else {
      try {
        const meta = (await fs.readJson(metaFile)) as ModuleMeta | ModuleMeta[];
        perFileEntries = normalizeMetaEntries(meta, moduleDirName);
      } catch {
        perFileEntries = normalizeMetaEntries(null, moduleDirName);
      }
    }

    for (const metaEntry of perFileEntries) {
      const moduleName = metaEntry.module || moduleDirName;
      const description = metaEntry.description || '';
      const source = metaEntry.source || '';
      const defaultModuleRoot = path.join(docsDir, moduleName);

      let effectiveModuleRoot = defaultModuleRoot;
      if (source && preferSrc) {
        const resolvedSource = await resolveSourcePath(source, metaFile);
        if (resolvedSource) {
          effectiveModuleRoot = resolvedSource;
        }
      }

      if (!(await fs.pathExists(effectiveModuleRoot))) {
        continue;
      }

      const ignore: string[] = [];
      if (moduleRoot === docsDir && effectiveModuleRoot === moduleRoot) {
        for (const otherRoot of moduleRoots) {
          if (otherRoot === moduleRoot) continue;
          const rel = path.relative(moduleRoot, otherRoot).split(path.sep).join('/');
          if (rel && !rel.startsWith('..')) {
            ignore.push(`${rel}/**`);
          }
        }
      }

      const files = await fg(['**/*.{md,mdx}'], {
        cwd: effectiveModuleRoot,
        onlyFiles: true,
        absolute: true,
        ignore,
      });

      if (!files.length) {
        continue;
      }

      files.sort();

      const directoryChildren = buildDirectoryChildren(files, effectiveModuleRoot);
      const docEntries: DocEntryMeta[] = await Promise.all(
        files.map(async (file) => {
          const relativePath = path.relative(effectiveModuleRoot, file);
          const normalizedRelativePath = relativePath.split(path.sep).join('/');
          const canonicalPath = path.posix.join(moduleName, normalizedRelativePath);
          const content = await fs.readFile(file, 'utf8');
          const meta = extractDocMetadata(content, file);
          return {
            absolutePath: file,
            relativePath,
            canonicalPath,
            content,
            moduleName,
            moduleRoot,
            packageName,
            ...meta,
          };
        }),
      );

      const docMap = new Map<string, DocEntryMeta>(docEntries.map((entry) => [entry.absolutePath, entry]));
      groups.push({
        moduleName,
        description,
        moduleRoot,
        packageName,
        entries: docEntries,
        directoryChildren,
        docMap,
      });
    }
  }

  return groups;
}

async function buildDocsIndexForPackages(packageNames: string[]): Promise<Map<string, BuildResult>> {
  const moduleGroups: Map<string, ModuleGroup[]> = new Map();
  const moduleDescriptions: Map<string, string> = new Map();
  const conflicts: Map<string, string[]> = new Map();

  for (const packageName of packageNames) {
    const groups = await collectModuleGroups(packageName);
    for (const group of groups) {
      const existing = moduleGroups.get(group.moduleName);
      if (existing) {
        existing.push(group);
      } else {
        moduleGroups.set(group.moduleName, [group]);
      }

      if (group.description) {
        const existingDesc = moduleDescriptions.get(group.moduleName);
        if (existingDesc && existingDesc !== group.description) {
          const list = conflicts.get(group.moduleName) || [];
          list.push(
            `${group.packageName}: description mismatch (existing="${existingDesc}", new="${group.description}")`,
          );
          conflicts.set(group.moduleName, list);
        } else if (!existingDesc) {
          moduleDescriptions.set(group.moduleName, group.description);
        }
      }
    }
  }

  const results = new Map<string, BuildResult>();

  for (const [moduleName, groups] of moduleGroups.entries()) {
    const outputDir = path.join(DOCS_STORAGE_DIR, moduleName);

    if (!groups.length) {
      results.set(moduleName, { created: false, reason: 'no doc files found' });
      continue;
    }

    const docsOutputDir = outputDir;
    const index = new FlexSearchIndex();
    const fileMap: Record<number, string> = {};
    let currentId = 1;
    let indexedDocs = 0;
    const markdownExt = new Set(['.md', '.mdx']);
    const storagePathMap = new Map<string, DocEntryMeta>();
    const moduleConflicts: string[] = [];

    await fs.remove(outputDir);
    await fs.ensureDir(docsOutputDir);

    const sortedGroups = groups.slice().sort((a, b) => {
      if (a.packageName !== b.packageName) {
        return a.packageName.localeCompare(b.packageName);
      }
      return a.moduleRoot.localeCompare(b.moduleRoot);
    });

    for (const group of sortedGroups) {
      for (const entry of group.entries) {
        const storageDocPath = path.join(docsOutputDir, entry.relativePath);
        const existing = storagePathMap.get(storageDocPath);
        if (existing) {
          moduleConflicts.push(
            `Duplicate path "${entry.relativePath}" from ${entry.packageName} and ${existing.packageName}`,
          );
          continue;
        }
        storagePathMap.set(storageDocPath, entry);

        await fs.ensureDir(path.dirname(storageDocPath));
        let processedContent = rewriteRelativeLinks(entry.content, entry);

        const splitResult = splitMarkdownIfNeeded(processedContent, entry);
        const splitRefs = splitResult.splits.map((split, index) => {
          const splitRelativePath = entry.relativePath.replace(/\.mdx?$/i, '') + split.suffix;
          const splitCanonicalPath = path.posix.join(entry.moduleName, splitRelativePath.split(path.sep).join('/'));
          return {
            index,
            splitRelativePath,
            splitCanonicalPath,
            ...split,
          };
        });

        processedContent = splitResult.content;

        if (entry.isIndex) {
          processedContent = applyReferencesToIndex(
            processedContent,
            entry.absolutePath,
            group.directoryChildren,
            group.docMap,
          );
        }

        if (splitRefs.length) {
          processedContent = applySplitReferences(
            processedContent,
            splitRefs.map((split) => ({
              pathRef: split.splitCanonicalPath,
              title: split.title,
              description: split.description,
            })),
          );
        }

        if (!entry.hasFrontMatter) {
          processedContent = injectFrontMatter(processedContent, entry);
        }

        await fs.writeFile(storageDocPath, processedContent, 'utf8');

        for (const split of splitRefs) {
          const splitStoragePath = path.join(docsOutputDir, split.splitRelativePath);
          if (storagePathMap.has(splitStoragePath)) {
            moduleConflicts.push(`Duplicate split path "${split.splitRelativePath}" in ${entry.packageName}`);
            continue;
          }
          storagePathMap.set(splitStoragePath, entry);
          await fs.ensureDir(path.dirname(splitStoragePath));
          let splitContent = split.content;
          splitContent = injectFrontMatter(splitContent, {
            title: split.title,
            description: split.description,
          });
          await fs.writeFile(splitStoragePath, splitContent, 'utf8');
        }

        const ext = path.extname(entry.absolutePath).toLowerCase();
        if (!markdownExt.has(ext)) {
          continue;
        }

        const content = processedContent.trim();
        if (!content) {
          continue;
        }
        const docId = currentId++;
        await index.addAsync(docId, processedContent);
        fileMap[docId] = entry.canonicalPath;
        indexedDocs++;
      }
    }

    if (!indexedDocs) {
      await fs.remove(outputDir);
      results.set(moduleName, { created: false, reason: 'no markdown doc content to index' });
      continue;
    }

    const indexData: Record<string, string> = {};
    index.export((key, data) => {
      indexData[key] = data;
    });

    await fs.ensureDir(outputDir);
    await fs.writeJSON(path.join(outputDir, 'index.json'), indexData, { spaces: 2 });
    await fs.writeJSON(path.join(outputDir, 'files.json'), fileMap, { spaces: 2 });
    const allConflicts = [...(conflicts.get(moduleName) || []), ...moduleConflicts];
    if (allConflicts.length) {
      results.set(moduleName, { created: true, conflicts: allConflicts });
    } else {
      results.set(moduleName, { created: true });
    }
  }

  if (moduleGroups.size) {
    const metaOutput: Record<string, { description: string }> = {};
    for (const moduleName of moduleGroups.keys()) {
      metaOutput[moduleName] = {
        description: moduleDescriptions.get(moduleName) || '',
      };
    }
    await fs.ensureDir(DOCS_STORAGE_DIR);
    await fs.writeJSON(path.join(DOCS_STORAGE_DIR, 'meta.json'), metaOutput, { spaces: 2 });
  }

  return results;
}

function extractDocMetadata(content: string, filePath: string) {
  const normalized = content.replace(/\r\n/g, '\n');
  const hasFrontMatter = normalized.startsWith('---\n') && normalized.indexOf('\n---', 4) !== -1;
  let searchStart = 0;
  if (hasFrontMatter) {
    const closingIndex = normalized.indexOf('\n---', 4);
    if (closingIndex !== -1) {
      const closingLineEnd = normalized.indexOf('\n', closingIndex + 4);
      searchStart = closingLineEnd === -1 ? normalized.length : closingLineEnd + 1;
    }
  }
  let title = '';
  let description = '';
  const lines = normalized.slice(searchStart).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      let j = i + 1;
      const descParts: string[] = [];
      while (j < lines.length) {
        const descLine = lines[j].trim();
        if (!descLine) {
          if (descParts.length) break;
          j++;
          continue;
        }
        if (descLine.startsWith('#')) break;
        descParts.push(descLine);
        if (descParts.join(' ').length > 160) break;
        j++;
      }
      description = descParts.join(' ');
      break;
    }
  }

  if (!title) {
    const base = path.basename(filePath, path.extname(filePath));
    title = base
      .split(/[-_]/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  if (!description) {
    description = `Reference snippet for ${title}`;
  }

  return {
    title,
    description,
    hasFrontMatter,
    isIndex: path.basename(filePath).toLowerCase() === 'index.md',
  };
}

function injectFrontMatter(content: string, meta: { title: string; description: string }) {
  const trimmed = content.replace(/^\uFEFF/, '');
  const fmLines = [
    '---',
    `title: ${JSON.stringify(meta.title)}`,
    `description: ${JSON.stringify(meta.description)}`,
    '---',
  ];
  const frontMatter = `${fmLines.join('\n')}\n`;
  const separator = trimmed.startsWith('\n') ? '' : '\n';
  return `${frontMatter}${separator}${trimmed}`;
}

function splitFrontMatter(content: string) {
  const normalized = content.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { frontMatter: '', body: normalized, hasFrontMatter: false };
  }
  const closingIndex = normalized.indexOf('\n---', 4);
  if (closingIndex === -1) {
    return { frontMatter: '', body: normalized, hasFrontMatter: false };
  }
  const closingLineEnd = normalized.indexOf('\n', closingIndex + 4);
  const bodyStart = closingLineEnd === -1 ? normalized.length : closingLineEnd + 1;
  return {
    frontMatter: normalized.slice(0, bodyStart),
    body: normalized.slice(bodyStart),
    hasFrontMatter: true,
  };
}

function getPrimaryHeading(body: string) {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || '';
}

function countCodeBlocks(content: string) {
  return (content.match(/```[\s\S]*?```/g) || []).length;
}

function normalizeHeadingText(text: string) {
  return text.replace(/^#+\s+/, '').trim();
}

function splitByHeadings(body: string) {
  const lines = body.split('\n');
  const sections: Array<{ level: number; heading: string; content: string[] }> = [];
  let current: { level: number; heading: string; content: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (current) {
        sections.push(current);
      }
      current = {
        level: headingMatch[1].length,
        heading: normalizeHeadingText(headingMatch[0]),
        content: [],
      };
      continue;
    }
    if (current) {
      current.content.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections.filter((section) => section.content.join('\n').trim().length > 0);
}

function splitExamples(body: string) {
  const codeRegex = /```[\s\S]*?```/g;
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ index: number; level: number; text: string; key: string }> = [];
  for (const match of body.matchAll(headingRegex)) {
    const raw = normalizeHeadingText(match[0]);
    const key = raw.toLowerCase();
    headings.push({
      index: match.index ?? 0,
      level: match[1].length,
      text: raw,
      key,
    });
  }

  const examples: Array<{ heading: string; content: string }> = [];
  const excludeKeys = new Set([
    'type definition',
    'type definition (simplified)',
    'parameters',
    'return value',
    '类型定义',
    '参数',
    '返回值',
  ]);
  const codeMatches = Array.from(body.matchAll(codeRegex));
  const exampleCodeRanges: Array<{ start: number; end: number }> = [];
  const exampleSectionRanges: Array<{ start: number; end: number }> = [];

  for (const match of codeMatches) {
    const code = match[0];
    const index = match.index ?? 0;
    const priorHeadings = headings.filter((item) => item.index < index);
    const currentH2 = priorHeadings.filter((item) => item.level === 2).slice(-1)[0];
    const currentH3 = priorHeadings.filter((item) => item.level === 3).slice(-1)[0];
    const h2Key = currentH2?.key || '';
    const h3Key = currentH3?.key || '';

    if (excludeKeys.has(h2Key) || excludeKeys.has(h3Key)) {
      continue;
    }

    const heading = currentH3?.text || currentH2?.text || '';
    examples.push({ heading, content: code });
    exampleCodeRanges.push({ start: index, end: index + code.length });
    if (currentH3 || currentH2) {
      const anchor = currentH3 || currentH2;
      const nextHeadingIndex =
        headings.filter((item) => item.index > anchor.index && item.level <= anchor.level).slice(0, 1)[0]?.index ??
        body.length;
      exampleSectionRanges.push({ start: anchor.index, end: nextHeadingIndex });
    }
  }

  let cleanedBody = body;
  if (exampleSectionRanges.length) {
    const ranges = exampleSectionRanges
      .sort((a, b) => a.start - b.start)
      .filter((range, index, list) => index === 0 || range.start >= list[index - 1].end);
    let result = '';
    let last = 0;
    for (const range of ranges) {
      result += body.slice(last, range.start);
      last = range.end;
    }
    result += body.slice(last);
    cleanedBody = result;
  } else if (exampleCodeRanges.length) {
    const ranges = exampleCodeRanges
      .sort((a, b) => a.start - b.start)
      .filter((range, index, list) => index === 0 || range.start >= list[index - 1].end);
    let result = '';
    let last = 0;
    for (const range of ranges) {
      result += body.slice(last, range.start);
      last = range.end;
    }
    result += body.slice(last);
    cleanedBody = result;
  }

  return { examples, cleanedBody };
}

function splitMarkdownIfNeeded(content: string, entry: DocEntryMeta) {
  const { body, frontMatter, hasFrontMatter } = splitFrontMatter(content);
  const bodyLength = body.trim().length;
  const codeBlocks = countCodeBlocks(body);
  const shouldSplitByLength = bodyLength > SPLIT_MAX_LENGTH;
  const shouldSplitByExamples = codeBlocks > SPLIT_MAX_CODE_BLOCKS;
  if (!shouldSplitByLength && !shouldSplitByExamples) {
    return {
      splits: [] as Array<{ suffix: string; title: string; description: string; content: string }>,
      content,
    };
  }

  const h1 = getPrimaryHeading(body) || entry.title;
  const splits: Array<{ suffix: string; title: string; description: string; content: string }> = [];
  let nextBody = body;
  let didSplitByExamples = false;

  if (shouldSplitByExamples) {
    const { examples, cleanedBody } = splitExamples(body);
    if (examples.length) {
      didSplitByExamples = true;
      nextBody = cleanedBody;
      examples.forEach((example, index) => {
        const headingLine = example.heading ? `## ${example.heading}\n\n` : '';
        const exampleContent = `# ${h1}\n\n${headingLine}${example.content}\n`;
        const title = example.heading ? `${example.heading} Example` : `${h1} Example ${index + 1}`;
        splits.push({
          suffix: `__example-${index + 1}.md`,
          title,
          description: `Extracted example from ${entry.title}`,
          content: exampleContent,
        });
      });
    }
  }

  if (shouldSplitByLength && !didSplitByExamples) {
    const sections = splitByHeadings(body);
    sections.forEach((section, index) => {
      const headingLine = `${'#'.repeat(section.level)} ${section.heading}`;
      const sectionBody = section.content.join('\n').trim();
      const chunkContent = `# ${h1}\n\n${headingLine}\n${sectionBody}\n`;
      const title = section.heading || `${h1} Chunk ${index + 1}`;
      splits.push({
        suffix: `__chunk-${index + 1}.md`,
        title,
        description: `Extracted section from ${entry.title}`,
        content: chunkContent,
      });
    });
  }

  const rebuilt = hasFrontMatter ? `${frontMatter}${nextBody}` : nextBody;
  return { splits, content: rebuilt };
}

function applySplitReferences(content: string, splits: Array<{ pathRef: string; title: string; description: string }>) {
  if (!splits.length) return content;
  const refLines = splits.map((split) => referenceLine(split.title, split.description, split.pathRef));
  const baseContent = stripSplitReferenceBlock(content).trimEnd();
  const block = `${SPLIT_REFERENCE_START}\n\n## Extracted references\n\n${refLines.join(
    '\n',
  )}\n\n${SPLIT_REFERENCE_END}`;
  if (!baseContent) {
    return `${block}\n`;
  }
  return `${baseContent}\n\n${block}\n`;
}

function stripSplitReferenceBlock(content: string) {
  const start = content.indexOf(SPLIT_REFERENCE_START);
  if (start === -1) return content;
  const end = content.indexOf(SPLIT_REFERENCE_END, start + SPLIT_REFERENCE_START.length);
  if (end === -1) return content;
  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + SPLIT_REFERENCE_END.length).trimStart();
  if (!before) return after;
  if (!after) return `${before}\n`;
  return `${before}\n\n${after}`;
}

function rewriteRelativeLinks(content: string, entry: DocEntryMeta) {
  const { body, frontMatter, hasFrontMatter } = splitFrontMatter(content);
  const segments: Array<{ type: 'code' | 'text'; content: string }> = [];
  const codeRegex = /```[\s\S]*?```/g;
  let lastIndex = 0;
  for (const match of body.matchAll(codeRegex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: 'text', content: body.slice(lastIndex, index) });
    }
    segments.push({ type: 'code', content: match[0] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < body.length) {
    segments.push({ type: 'text', content: body.slice(lastIndex) });
  }

  const dir = path.posix.dirname(entry.relativePath.split(path.sep).join('/'));

  const rewritten = segments
    .map((segment) => {
      if (segment.type === 'code') return segment.content;
      return segment.content.replace(/(!?)\[[^\]]+]\(([^)]+)\)/g, (match, bang, link) => {
        if (bang) return match;
        const trimmed = link.trim();
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('/') ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('mailto:') ||
          trimmed.startsWith('tel:')
        ) {
          return match;
        }

        const hashIndex = trimmed.indexOf('#');
        const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : '';
        const beforeHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
        const queryIndex = beforeHash.indexOf('?');
        const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : '';
        const pathPart = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

        const resolved = path.posix.normalize(path.posix.join(dir, pathPart));
        const normalized = resolved.startsWith('.') ? resolved.replace(/^(\.\.\/?)+/, '') : resolved;
        const absolutePath = path.posix.join('/', entry.moduleName, normalized);
        const nextLink = `${absolutePath}${query}${hash}`;
        return match.replace(link, nextLink);
      });
    })
    .join('');

  if (!hasFrontMatter) {
    return rewritten;
  }
  return `${frontMatter}${rewritten}`;
}

function applyReferencesToIndex(
  content: string,
  filePath: string,
  directoryChildren: DirectoryChildren,
  docMap: Map<string, DocEntryMeta>,
) {
  const dir = path.dirname(filePath);
  const entry = directoryChildren.get(dir);
  if (!entry) {
    return stripExistingReferenceBlock(content);
  }

  const refLines: string[] = [];
  const refs = new Set<string>();

  const childFiles = entry.files.filter((file) => file !== path.join(dir, 'index.md'));
  for (const child of childFiles.sort()) {
    const meta = docMap.get(child);
    if (!meta) continue;
    const refPath = meta.canonicalPath;
    if (refs.has(refPath)) continue;
    refs.add(refPath);
    refLines.push(referenceLine(meta.title, meta.description, refPath));
  }

  for (const subDir of entry.directories.sort()) {
    const indexFile = path.join(subDir, 'index.md');
    const meta = docMap.get(indexFile);
    if (!meta) continue;
    const refPath = meta.canonicalPath;
    if (refs.has(refPath)) continue;
    refs.add(refPath);
    refLines.push(referenceLine(meta.title, meta.description, refPath));
  }

  if (!refLines.length) {
    return stripExistingReferenceBlock(content);
  }

  const baseContent = stripExistingReferenceBlock(content).trimEnd();
  const block = `${REFERENCE_START}\n\n## References\n\n${refLines.join('\n')}\n\n${REFERENCE_END}`;
  if (!baseContent) {
    return `${block}\n`;
  }
  return `${baseContent}\n\n${block}\n`;
}

function referenceLine(title: string, description: string, pathRef: string) {
  const summary = description.length > 200 ? `${description.slice(0, 197)}...` : description;
  const descText = summary ? ` - ${summary}` : '';
  return `- **${title}** (\`${pathRef}\`)${descText}`;
}

function stripExistingReferenceBlock(content: string) {
  const start = content.indexOf(REFERENCE_START);
  if (start === -1) return content;
  const end = content.indexOf(REFERENCE_END, start + REFERENCE_START.length);
  if (end === -1) return content;
  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + REFERENCE_END.length).trimStart();
  if (!before) return after;
  if (!after) return `${before}\n`;
  return `${before}\n\n${after}`;
}

export async function createDocsIndex(app: Application, options: DocsIndexOptions = {}) {
  const pkgs = await resolvePkgs(options.pkg);
  if (!pkgs.length) {
    app.log.info('No plugin packages detected for docs index generation');
    return;
  }

  const packageNames: string[] = [];
  for (const pkg of pkgs) {
    try {
      const { packageName } = await PluginManager.parseName(pkg);
      packageNames.push(packageName);
    } catch (error) {
      app.log.error(error, { pkg });
    }
  }

  if (!packageNames.length) {
    app.log.info('No plugin packages resolved for docs index generation');
    return;
  }

  let results: Map<string, BuildResult> | null = null;
  let lastError: unknown;
  for (let attempt = 0; attempt < CREATE_INDEX_RETRY_MAX; attempt++) {
    try {
      results = await buildDocsIndexForPackages(packageNames);
      break;
    } catch (error) {
      lastError = error;
      if (attempt === CREATE_INDEX_RETRY_MAX - 1) {
        break;
      }
      app.log.warn(`Docs index build failed, retrying (${attempt + 1}/${CREATE_INDEX_RETRY_MAX})`);
      await new Promise((resolve) => setTimeout(resolve, CREATE_INDEX_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  if (!results) {
    const message = lastError ? errorToString(lastError) : 'Docs index build failed';
    app.log.error(message);
    return;
  }
  if (!results.size) {
    app.log.info('No module docs found to index');
    return;
  }

  for (const [moduleName, result] of results.entries()) {
    if (result.created) {
      app.log.info(`Docs index generated for module "${moduleName}"`);
      if (result.conflicts?.length) {
        app.log.warn(`Module "${moduleName}" has conflicts: ${result.conflicts.join('; ')}`);
      }
    } else {
      app.log.info(`Skipped docs index for module "${moduleName}": ${result.reason}`);
    }
  }
}
