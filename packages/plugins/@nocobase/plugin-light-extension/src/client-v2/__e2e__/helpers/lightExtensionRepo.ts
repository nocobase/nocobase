/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, Page } from '@playwright/test';

import {
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../../constants';
import { createLightExtensionBaseTemplate } from '../../../shared/default-template';
import type { LightExtensionPullResult, LightExtensionTreeEntryInput } from '../../../shared/types';
import { assertApiResponseOk, getErrorMessage, isRecord, readApiResponse, type RootApiSession } from './api';

export const LIGHT_EXTENSION_ACCEPTANCE_SETTINGS: Record<string, unknown> = {
  outputLabel: {
    type: 'string',
    title: 'Output label',
    default: 'Initial output',
  },
  mode: {
    type: 'integer',
    title: 'Mode',
    enum: [1, 2],
    default: 1,
  },
  mode1Options: {
    type: 'object',
    title: 'Mode 1 settings',
    'x-visible-when': {
      path: 'mode',
      operator: '$eq',
      value: 1,
    },
    properties: {
      message: {
        type: 'string',
        title: 'Mode 1 message',
        default: 'Mode 1',
      },
    },
  },
  mode2Options: {
    type: 'object',
    title: 'Mode 2 settings',
    'x-visible-when': {
      path: 'mode',
      operator: '$eq',
      value: 2,
    },
    properties: {
      color: {
        type: 'string',
        title: 'Mode 2 color',
        default: '#1677ff',
      },
    },
  },
  displayOptions: {
    type: 'object',
    title: 'Display settings',
    properties: {
      enableColor: {
        type: 'boolean',
        title: 'Enable color',
        default: false,
      },
      advancedColor: {
        type: 'string',
        title: 'Advanced color',
        default: '#f5222d',
        'x-visible-when': {
          logic: '$and',
          items: [
            { path: 'mode', operator: '$eq', value: 2 },
            { path: 'displayOptions.enableColor', operator: '$eq', value: true },
          ],
        },
      },
    },
  },
};

export type LightExtensionAcceptanceEntry = {
  id: string;
  repoId: string;
  kind: LightExtensionKind;
  entryName: string;
  entryPath: string;
  title: string;
};

export type LightExtensionAcceptanceRepo = {
  id: string;
  name: string;
  title: string;
  headCommitId: string;
  entries: Record<LightExtensionKind, LightExtensionAcceptanceEntry>;
};

export type LightExtensionAcceptanceSourceBinding = {
  type: 'light-extension-entry';
  repoId: string;
  repoTitle: string;
  entryId: string;
  entryName: string;
  entryPath: string;
  entryTitle: string;
  kind: LightExtensionKind;
};

export type CreateLightExtensionAcceptanceRepoOptions = {
  name?: string;
  title?: string;
};

export type ReplaceLightExtensionAcceptanceEntrySourceInput = {
  repo: Pick<LightExtensionAcceptanceRepo, 'id' | 'entries'>;
  kind: LightExtensionKind;
  source: string;
  message?: string;
};

type RepoApiRecord = {
  id: string | number;
  name?: string;
  title?: string;
  headCommitId: string;
};

type SaveSourceResult = {
  repo?: {
    headCommitId?: string;
  };
  commit?: {
    id?: string;
  };
};

type EntrySourceDefinition = {
  kind: LightExtensionKind;
  directory: string;
  filename: string;
  title: string;
  source: string;
};

let repoSequence = 0;

const ENTRY_SOURCE_DEFINITIONS: readonly EntrySourceDefinition[] = [
  {
    kind: 'js-block',
    directory: 'js-blocks',
    filename: 'index.tsx',
    title: 'Acceptance JS Block',
    source:
      'ctx.render(<div data-testid="light-extension-acceptance-js-block">{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</div>);\n',
  },
  {
    kind: 'js-page',
    directory: 'js-pages',
    filename: 'index.tsx',
    title: 'Acceptance JS Page',
    source: [
      "import { createClient } from '@nocobase/sdk/client';",
      'const client = createClient();',
      "let getStatus = 'request-failed';",
      "let postStatus = 'request-failed';",
      'try {',
      "  const response = await client.request({ url: 'app:getInfo', method: 'get' });",
      '  getStatus = String(response.status);',
      '} catch (error) {',
      '  getStatus = `error:${String(error)}`;',
      '}',
      'try {',
      "  const response = await client.request({ url: 'auth:check', method: 'post' });",
      '  postStatus = String(response.status);',
      '} catch (error) {',
      '  postStatus = `error:${String(error)}`;',
      '}',
      'ctx.render(',
      '  <div',
      '    data-testid="light-extension-acceptance-js-page"',
      '    data-sdk-get-status={getStatus}',
      '    data-sdk-post-status={postStatus}',
      '  >',
      '    {ctx.page.uid}:{String(ctx.settings.outputLabel)}',
      '  </div>,',
      ');',
      '',
    ].join('\n'),
  },
  {
    kind: 'js-field',
    directory: 'js-fields',
    filename: 'index.tsx',
    title: 'Acceptance JS Field',
    source:
      'ctx.render(<span data-testid="light-extension-acceptance-js-field">{String(ctx.value ?? "")}:{String(ctx.settings.outputLabel)}</span>);\n',
  },
  {
    kind: 'js-action',
    directory: 'js-actions',
    filename: 'index.ts',
    title: 'Acceptance JS Action',
    source: 'ctx.message.success(`${String(ctx.settings.outputLabel)}:${String(ctx.settings.mode)}`);\n',
  },
  {
    kind: 'js-item',
    directory: 'js-items',
    filename: 'index.tsx',
    title: 'Acceptance JS Item',
    source:
      'ctx.render(<span data-testid="light-extension-acceptance-js-item">{String(ctx.settings.outputLabel)}:{String(ctx.settings.mode)}</span>);\n',
  },
  {
    kind: 'runjs',
    directory: 'runjs',
    filename: 'index.ts',
    title: 'Acceptance RunJS Value',
    source: 'return `runjs-value:${String(ctx.settings.outputLabel)}:${String(ctx.settings.mode)}`;\n',
  },
] as const satisfies readonly EntrySourceDefinition[];

function nextRepoName(): string {
  repoSequence += 1;
  return `light-extension-acceptance-${Date.now()}-${repoSequence}`;
}

function requireString(record: Record<string, unknown>, key: string, context: string): string {
  const value = record[key];
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`${context} does not contain ${key}`);
  }
  return String(value);
}

function readRepoRecord(value: unknown, fallbackName: string, fallbackTitle: string): RepoApiRecord {
  const candidate = isRecord(value) && isRecord(value.repo) ? value.repo : value;
  if (!isRecord(candidate)) {
    throw new Error('Light Extension repo create response is invalid');
  }
  return {
    id: requireString(candidate, 'id', 'Light Extension repo create response'),
    name: typeof candidate.name === 'string' ? candidate.name : fallbackName,
    title: typeof candidate.title === 'string' ? candidate.title : fallbackTitle,
    headCommitId: requireString(candidate, 'headCommitId', 'Light Extension repo create response'),
  };
}

function createEntryFiles(): LightExtensionTreeEntryInput[] {
  const definitionKinds = new Set<string>();
  for (const definition of ENTRY_SOURCE_DEFINITIONS) {
    if (definitionKinds.has(definition.kind)) {
      throw new Error(`Duplicate Light Extension acceptance entry definition for ${definition.kind}`);
    }
    definitionKinds.add(definition.kind);
  }
  const missingKinds = LIGHT_EXTENSION_SUPPORTED_KINDS.filter((kind) => !definitionKinds.has(kind));
  const unsupportedKinds = [...definitionKinds].filter(
    (kind) => !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind),
  );
  if (missingKinds.length || unsupportedKinds.length) {
    throw new Error(
      `Light Extension acceptance entry definitions do not match supported RunJS kinds: missing=${missingKinds.join(
        ',',
      )}; unsupported=${unsupportedKinds.join(',')}`,
    );
  }

  const files = createLightExtensionBaseTemplate();
  for (const definition of ENTRY_SOURCE_DEFINITIONS) {
    const entryName = `acceptance-${definition.kind}`;
    const entryRoot = `src/client/${definition.directory}/${entryName}`;
    files.push(
      {
        path: `${entryRoot}/${definition.filename}`,
        content: definition.source,
        language: 'typescript',
      },
      {
        path: `${entryRoot}/entry.json`,
        content: `${JSON.stringify(
          {
            schemaVersion: LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
            key: entryName,
            title: definition.title,
            settings: LIGHT_EXTENSION_ACCEPTANCE_SETTINGS,
          },
          null,
          2,
        )}\n`,
        language: 'json',
      },
    );
  }
  return files;
}

function readEntriesPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isRecord(value) && Array.isArray(value.entries)) {
    return value.entries;
  }
  throw new Error('Light Extension selectable entries response is invalid');
}

function readAcceptanceEntry(value: unknown, repoId: string, kind: LightExtensionKind): LightExtensionAcceptanceEntry {
  if (!isRecord(value)) {
    throw new Error(`Selectable ${kind} entry response is invalid`);
  }
  const entryKind = requireString(value, 'kind', `Selectable ${kind} entry response`);
  if (entryKind !== kind) {
    throw new Error(`Selectable entry kind mismatch: expected ${kind}, received ${entryKind}`);
  }
  const entryName = requireString(value, 'entryName', `Selectable ${kind} entry response`);
  return {
    id: requireString(value, 'id', `Selectable ${kind} entry response`),
    repoId: typeof value.repoId === 'string' || typeof value.repoId === 'number' ? String(value.repoId) : repoId,
    kind,
    entryName,
    entryPath: requireString(value, 'entryPath', `Selectable ${kind} entry response`),
    title:
      (typeof value.title === 'string' && value.title) ||
      (typeof value.entryTitle === 'string' && value.entryTitle) ||
      entryName,
  };
}

async function listAcceptanceEntry(
  page: Page,
  session: RootApiSession,
  repoId: string,
  kind: LightExtensionKind,
): Promise<LightExtensionAcceptanceEntry> {
  const response = await page.request.post('/api/lightExtensionEntries:listSelectable', {
    headers: session.headers,
    data: { repoId, kind },
  });
  const payload = await readApiResponse<unknown>(response, `List selectable ${kind} entries`);
  const entries = readEntriesPayload(payload);
  const expectedEntryName = `acceptance-${kind}`;
  const selected = entries.find((entry) => isRecord(entry) && entry.entryName === expectedEntryName);
  if (!selected) {
    throw new Error(`Selectable ${kind} entry "${expectedEntryName}" was not created`);
  }
  return readAcceptanceEntry(selected, repoId, kind);
}

export async function createLightExtensionAcceptanceRepo(
  page: Page,
  session: RootApiSession,
  options: CreateLightExtensionAcceptanceRepoOptions = {},
): Promise<LightExtensionAcceptanceRepo> {
  const name = options.name || nextRepoName();
  const title = options.title || 'Light Extension acceptance repo';
  const response = await page.request.post('/api/lightExtensionRepos:create', {
    headers: session.headers,
    data: {
      name,
      title,
      initialFiles: createEntryFiles(),
    },
  });
  const payload = await readApiResponse<unknown>(response, 'Create Light Extension acceptance repo');
  const repo = readRepoRecord(payload, name, title);
  const repoId = String(repo.id);

  try {
    const entries: Partial<Record<LightExtensionKind, LightExtensionAcceptanceEntry>> = {};
    for (const kind of LIGHT_EXTENSION_SUPPORTED_KINDS) {
      entries[kind] = await listAcceptanceEntry(page, session, repoId, kind);
    }
    for (const kind of LIGHT_EXTENSION_SUPPORTED_KINDS) {
      if (!entries[kind]) {
        throw new Error(`Selectable ${kind} acceptance entry was not loaded`);
      }
    }
    return {
      id: repoId,
      name: repo.name || name,
      title: repo.title || title,
      headCommitId: repo.headCommitId,
      entries: entries as Record<LightExtensionKind, LightExtensionAcceptanceEntry>,
    };
  } catch (error) {
    try {
      await removeLightExtensionAcceptanceRepo(page, session, repoId);
    } catch (cleanupError) {
      throw new Error(
        `Acceptance repo setup failed: ${getErrorMessage(error)}; cleanup also failed: ${getErrorMessage(
          cleanupError,
        )}`,
      );
    }
    throw error;
  }
}

export function getAcceptanceSourceBinding(
  repo: LightExtensionAcceptanceRepo,
  kind: LightExtensionKind,
): LightExtensionAcceptanceSourceBinding {
  const entry = repo.entries[kind];
  return {
    type: 'light-extension-entry',
    repoId: repo.id,
    repoTitle: repo.title,
    entryId: entry.id,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    entryTitle: entry.title,
    kind,
  };
}

export async function saveLightExtensionAcceptanceSource(
  page: Page,
  session: RootApiSession,
  input: {
    repoId: string;
    expectedHeadCommitId: string;
    files: LightExtensionTreeEntryInput[];
    message?: string;
  },
): Promise<string> {
  const response = await page.request.post('/api/lightExtensionFiles:saveSource', {
    headers: session.headers,
    data: {
      repoId: input.repoId,
      expectedHeadCommitId: input.expectedHeadCommitId,
      files: input.files,
      message: input.message || 'Update acceptance source',
    },
  });
  const result = await readApiResponse<SaveSourceResult>(response, 'Save Light Extension acceptance source');
  const nextHeadCommitId = result.commit?.id || result.repo?.headCommitId;
  if (!nextHeadCommitId) {
    throw new Error('Save Light Extension acceptance source response does not contain a commit id');
  }
  return nextHeadCommitId;
}

export async function replaceLightExtensionAcceptanceEntrySource(
  page: Page,
  session: RootApiSession,
  input: ReplaceLightExtensionAcceptanceEntrySourceInput,
): Promise<string> {
  const pullResponse = await page.request.post('/api/lightExtensionFiles:pull', {
    headers: session.headers,
    data: {
      repoId: input.repo.id,
      includeContent: 'all',
    },
  });
  const pullResult = await readApiResponse<LightExtensionPullResult>(
    pullResponse,
    'Pull Light Extension acceptance source',
  );
  const expectedHeadCommitId = pullResult.repo?.headCommitId;
  if (!expectedHeadCommitId) {
    throw new Error('Pull Light Extension acceptance source response does not contain a head commit id');
  }
  if (!Array.isArray(pullResult.files)) {
    throw new Error('Pull Light Extension acceptance source response does not contain files');
  }

  const targetPath = input.repo.entries[input.kind].entryPath;
  let replacementCount = 0;
  const files = pullResult.files.map<LightExtensionTreeEntryInput>((file) => {
    if (typeof file.content !== 'string') {
      throw new Error(`Pulled Light Extension acceptance file "${file.path}" does not contain content`);
    }
    if (file.path === targetPath) {
      replacementCount += 1;
    }
    return {
      path: file.path,
      content: file.path === targetPath ? input.source : file.content,
      language: file.language,
      mode: file.mode,
    };
  });
  if (replacementCount !== 1) {
    throw new Error(
      `Expected exactly one ${input.kind} acceptance entry source at "${targetPath}", found ${replacementCount}`,
    );
  }

  return saveLightExtensionAcceptanceSource(page, session, {
    repoId: input.repo.id,
    expectedHeadCommitId,
    files,
    message: input.message || `Update ${input.kind} acceptance source`,
  });
}

async function runRepoCleanupRequest(response: APIResponse, operation: string) {
  if (response.ok() || response.status() === 404) {
    return;
  }
  await assertApiResponseOk(response, operation);
}

export async function removeLightExtensionAcceptanceRepo(
  page: Page,
  session: RootApiSession,
  repoId: string,
): Promise<void> {
  const failures: string[] = [];
  const archiveResponse = await page.request.post('/api/lightExtensionRepos:archive', {
    headers: session.headers,
    data: { repoId },
  });
  try {
    await runRepoCleanupRequest(archiveResponse, 'Archive Light Extension acceptance repo');
  } catch (error) {
    failures.push(getErrorMessage(error));
  }

  const deleteResponse = await page.request.post('/api/lightExtensionRepos:delete', {
    headers: session.headers,
    data: { repoId },
  });
  try {
    await runRepoCleanupRequest(deleteResponse, 'Delete Light Extension acceptance repo');
  } catch (error) {
    failures.push(getErrorMessage(error));
  }

  if (failures.length) {
    throw new Error(failures.join('; '));
  }
}

export function getAcceptanceEntryKinds(): readonly LightExtensionKind[] {
  return LIGHT_EXTENSION_SUPPORTED_KINDS;
}
