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
import { findAllPlugins } from '../plugin-manager/findPackageNames';
import Application from '../application';
import { PluginManager } from '../plugin-manager';

type DocsCommandOptions = {
  pkg?: string | string[];
};

const DOCS_STORAGE_DIR = path.resolve(process.cwd(), 'storage/ai/docs');

async function resolvePkgs(pkg?: string | string[]) {
  if (!pkg) {
    return await findAllPlugins();
  }
  const scopes = (Array.isArray(pkg) ? pkg : pkg.split(',')).map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set(scopes));
}

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

const REFERENCE_START = '<!-- docs:references:start -->';
const REFERENCE_END = '<!-- docs:references:end -->';

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

async function collectModuleGroups(packageName: string): Promise<ModuleGroup[]> {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageDir = path.dirname(packageJsonPath);
  const docsDir = path.join(packageDir, 'src', 'ai', 'docs');

  if (!(await fs.pathExists(docsDir))) {
    return [];
  }

  const moduleMetaFiles = await fg(['*/meta.json'], {
    cwd: docsDir,
    onlyFiles: true,
    absolute: true,
  });

  const rootMetaPath = path.join(docsDir, 'meta.json');
  const moduleMetaPaths = moduleMetaFiles.slice();
  if (await fs.pathExists(rootMetaPath)) {
    moduleMetaPaths.unshift(rootMetaPath);
  }

  if (!moduleMetaPaths.length) {
    return [];
  }

  moduleMetaPaths.sort();
  const moduleRoots = moduleMetaPaths.map((metaPath) => path.dirname(metaPath));

  const groups: ModuleGroup[] = [];
  for (const metaFile of moduleMetaPaths) {
    const moduleRoot = path.dirname(metaFile);
    const moduleDirName = path.basename(moduleRoot);
    let moduleName = moduleDirName;
    let description = '';
    try {
      const meta = await fs.readJson(metaFile);
      if (meta?.module && typeof meta.module === 'string') {
        moduleName = meta.module.trim() || moduleDirName;
      }
      if (meta?.description && typeof meta.description === 'string') {
        description = meta.description.trim();
      }
    } catch {
      moduleName = moduleDirName;
      description = '';
    }

    const ignore: string[] = [];
    if (moduleRoot === docsDir) {
      for (const otherRoot of moduleRoots) {
        if (otherRoot === moduleRoot) continue;
        const rel = path.relative(moduleRoot, otherRoot).split(path.sep).join('/');
        if (rel && !rel.startsWith('..')) {
          ignore.push(`${rel}/**`);
        }
      }
    }

    const files = await fg(['**/*.md'], {
      cwd: moduleRoot,
      onlyFiles: true,
      absolute: true,
      ignore,
    });

    if (!files.length) {
      continue;
    }

    files.sort();

    const directoryChildren = buildDirectoryChildren(files, moduleRoot);
    const docEntries: DocEntryMeta[] = await Promise.all(
      files.map(async (file) => {
        const relativePath = path.relative(moduleRoot, file);
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
    const markdownExt = new Set(['.md']);
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
        let processedContent = entry.content;

        if (entry.isIndex) {
          processedContent = applyReferencesToIndex(
            processedContent,
            entry.absolutePath,
            group.directoryChildren,
            group.docMap,
          );
        } else if (!entry.hasFrontMatter) {
          processedContent = injectFrontMatter(processedContent, entry);
        }

        await fs.writeFile(storageDocPath, processedContent, 'utf8');

        const ext = path.extname(entry.absolutePath).toLowerCase();
        if (!markdownExt.has(ext)) {
          continue;
        }
        if (entry.isIndex) {
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
  const descText = summary ? ` — ${summary}` : '';
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

export default (app: Application) => {
  const ai = app.command('ai');

  ai.command('create-docs-index')
    .option('--pkg [pkg]', 'Generate docs index for the specified plugin package (comma separated).')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs as [DocsCommandOptions?];
      const pkgs = await resolvePkgs(opts?.pkg);
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

      const results = await buildDocsIndexForPackages(packageNames);
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
    });
};
