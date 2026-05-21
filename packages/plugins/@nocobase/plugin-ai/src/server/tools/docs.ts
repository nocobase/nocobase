/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { Bash, InMemoryFs, MountableFs, OverlayFs, type CommandName, type IFileSystem } from 'just-bash';
import { ToolsOptions } from '@nocobase/ai';
import type { PluginAIServer } from '../plugin';

const DOCS_MOUNT_POINT = '/docs/nocobase';
const DOCS_MAX_OUTPUT_LENGTH = 20000;
const DOCS_EXEC_TIMEOUT_MS = 10000;
const DOCS_MAX_FILE_READ_SIZE = 1024 * 1024;

const DOCS_COMMANDS: CommandName[] = [
  'awk',
  'basename',
  'cat',
  'comm',
  'cut',
  'dirname',
  'du',
  'echo',
  'egrep',
  'expr',
  'false',
  'fgrep',
  'find',
  'fold',
  'grep',
  'head',
  'ls',
  'nl',
  'paste',
  'printf',
  'pwd',
  'rg',
  'sed',
  'seq',
  'sort',
  'stat',
  'tail',
  'tr',
  'true',
  'uniq',
  'wc',
  'which',
  'xargs',
];

export type DocsFsCache = { docsDir: string; fs: IFileSystem } | null;

export function createDocsSearchTool(plugin: PluginAIServer): ToolsOptions {
  return {
    scope: 'SPECIFIED',
    defaultPermission: 'ALLOW',
    introduction: {
      title: '{{t("Search documentation")}}',
      about: '{{t("Search docs tool description")}}',
    },
    definition: {
      name: 'searchDocs',
      description: `Run a restricted bash script to search and read NocoBase documentation.
The documentation root is ${DOCS_MOUNT_POINT}, and commands run from that directory.
Use commands such as rg, find, grep, sed, awk, head, tail, cat, ls, and wc.
The filesystem is readonly; do not attempt to write files. Keep output focused and prefer reading specific snippets instead of whole large files.
Prefer "rg --files <dir> | grep -Ei <pattern>" for file path discovery, and "rg -n <pattern> <dir>" for content search.
Avoid broad full-tree scans such as "find ." or "rg ... .", and do not pipe output into rg. Use grep for pipeline filtering instead. First choose likely top-level directories (for example get-started, interface-builder, workflow, multi-app, data-sources), then search within those directories.
Start narrow with a path search and focused snippets. For follow-up questions, reuse docs already read when possible, and respond once the snippets directly answer the question instead of expanding the search for extra background.`,
      schema: z.object({
        script: z
          .string()
          .min(1, 'script is required')
          .max(4000, 'script is too long')
          .describe('Bash script to search or read documentation under /docs/nocobase.'),
      }),
    },
    invoke: async (ctx, args) => {
      const script = String(args?.script ?? '').trim();
      if (!script) {
        return {
          status: 'error',
          content: 'script is required.',
        };
      }

      const validationError = validateDocsScript(script);
      if (validationError) {
        return {
          status: 'error',
          content: validationError,
        };
      }

      try {
        const bash = await createBash(plugin);

        const controller = new AbortController();
        const timer: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), DOCS_EXEC_TIMEOUT_MS);
        try {
          const result = await bash.exec(script, { cwd: DOCS_MOUNT_POINT, signal: controller.signal });
          return {
            status: 'success',
            content: JSON.stringify({
              exitCode: result.exitCode,
              stdout: truncateOutput(result.stdout),
              stderr: truncateOutput(result.stderr),
              truncated: result.stdout.length > DOCS_MAX_OUTPUT_LENGTH || result.stderr.length > DOCS_MAX_OUTPUT_LENGTH,
              ...(result.exitCode === 124 ? { hint: getDocsSearchHint('The docs search command timed out.') } : {}),
            }),
          };
        } finally {
          clearTimeout(timer);
        }
      } catch (error) {
        ctx.log?.error?.(error, {
          module: 'ai',
          subModule: 'toolCalling',
          toolName: 'searchDocs',
        });
        return {
          status: 'error',
          content: `Failed to search docs: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  };
}

async function createBash(plugin: PluginAIServer) {
  const docsDir = await resolveBuiltinDocsDir();
  const docsFs = await getDocsFs(plugin, docsDir);
  const mountableFs = new MountableFs({ base: new InMemoryFs() });
  mountableFs.mount(DOCS_MOUNT_POINT, docsFs);

  return new Bash({
    fs: mountableFs,
    cwd: DOCS_MOUNT_POINT,
    commands: DOCS_COMMANDS,
    python: false,
    javascript: false,
    executionLimits: {
      maxCommandCount: 1000,
      maxLoopIterations: 2000,
      maxAwkIterations: 2000,
      maxSedIterations: 2000,
      maxGlobOperations: 20000,
      maxOutputSize: DOCS_MAX_OUTPUT_LENGTH + 4096,
      maxStringLength: DOCS_MAX_OUTPUT_LENGTH + 4096,
    },
    defenseInDepth: false,
  });
}

async function getDocsFs(plugin: PluginAIServer, docsDir: string) {
  if (plugin.docsFsCache?.docsDir === docsDir) {
    return plugin.docsFsCache.fs;
  }

  const fs = new OverlayFs({
    root: docsDir,
    mountPoint: '/',
    readOnly: true,
    maxFileReadSize: DOCS_MAX_FILE_READ_SIZE,
  });
  plugin.docsFsCache = { docsDir, fs };
  return fs;
}

async function resolveBuiltinDocsDir() {
  const configured = process.env.NOCOBASE_AI_DOCS_DIR?.trim();
  if (configured) {
    const docsDir = path.resolve(configured);
    if (await fs.pathExists(docsDir)) {
      return docsDir;
    }
    throw new Error(`NOCOBASE_AI_DOCS_DIR does not exist: ${docsDir}`);
  }

  const sourceDocsDir = path.resolve(__dirname, '../../../../../../../docs/docs/en');
  if (process.env.APP_ENV !== 'production' && (await fs.pathExists(sourceDocsDir))) {
    return sourceDocsDir;
  }

  const packageDocsDir = path.resolve(__dirname, '../../ai/docs/nocobase');
  if (await fs.pathExists(packageDocsDir)) {
    return packageDocsDir;
  }

  if (await fs.pathExists(sourceDocsDir)) {
    return sourceDocsDir;
  }

  throw new Error(`NocoBase documentation directory not found. Checked: ${packageDocsDir}, ${sourceDocsDir}`);
}

function truncateOutput(output: string) {
  if (output.length <= DOCS_MAX_OUTPUT_LENGTH) {
    return output;
  }
  return `${output.slice(0, DOCS_MAX_OUTPUT_LENGTH)}\n...[truncated]`;
}

function validateDocsScript(script: string) {
  const commandText = maskQuotedText(script);

  if (new RegExp(String.raw`(^|[\n;&|])\s*find\s+(?:\.\/?|/docs/nocobase/?)(?:\s|$)`).test(commandText)) {
    return getDocsSearchHint('Broad full-tree scans with "find ." are not allowed.');
  }

  if (
    new RegExp(String.raw`(^|[\n;&|])\s*rg\b[^\n;&|]*\s(?:\.\/?|/docs/nocobase/?)\s*(?:[|;&\n]|$)`).test(commandText)
  ) {
    return getDocsSearchHint('Broad full-tree content searches with "rg ... ." are not allowed.');
  }

  if (/[|]\s*rg\b/.test(commandText)) {
    return getDocsSearchHint('Piping output into rg is not supported reliably by this docs shell.');
  }

  if (hasFindWithMultipleRoots(commandText)) {
    return getDocsSearchHint('find with multiple starting directories is too slow for docs search.');
  }

  return null;
}

function maskQuotedText(script: string) {
  let result = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const char of script) {
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\' && quote === '"') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
        result += char;
        continue;
      }
      result += ' ';
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      continue;
    }

    result += char;
  }

  return result;
}

function getDocsSearchHint(reason: string) {
  return `${reason}
Use scoped searches instead:
- list top-level entries first: ls -d */
- find matching file paths: rg --files multi-app | grep -Ei 'remote|local|index' | head -80
- list files in one directory: rg --files multi-app | head -80
- search content inside likely directories: rg -n -i 'keyword|another keyword' multi-app -g '*.md' -g '*.mdx' | head -80
- read focused snippets from likely files: sed -n '1,180p' get-started/quickstart.md`;
}

function hasFindWithMultipleRoots(script: string) {
  const findCommandPattern = /(^|[\n;&|])\s*find\s+([^\n;&|]+)/g;
  let match: RegExpExecArray | null;
  while ((match = findCommandPattern.exec(script))) {
    const args = match[2].trim().split(/\s+/);
    const roots = [];
    for (const arg of args) {
      if (arg.startsWith('-')) {
        break;
      }
      if (arg === '2>/dev/null') {
        continue;
      }
      roots.push(arg);
    }
    if (roots.length > 1) {
      return true;
    }
  }
  return false;
}
