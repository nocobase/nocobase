/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionSourceFileInput } from '../../services/LightExtensionValidator';

export const COMPILE_PERFORMANCE_FIXTURE_VERSION = 1 as const;

export const COMPILE_PERFORMANCE_FIXTURE_PROFILES = {
  small: {
    entryCount: 1,
    fileCount: 10,
    sharedFileCount: 2,
    privateFileCount: 5,
    rootFileCount: 1,
  },
  medium: {
    entryCount: 20,
    fileCount: 200,
    sharedFileCount: 20,
    privateFileCount: 139,
    rootFileCount: 1,
  },
} as const;

export type CompilePerformanceFixtureProfile = keyof typeof COMPILE_PERFORMANCE_FIXTURE_PROFILES;

export interface CompilePerformanceFixtureFile extends LightExtensionSourceFileInput {
  content: string;
  language: string;
}

export interface CompilePerformanceFixtureParameters {
  fixtureVersion: typeof COMPILE_PERFORMANCE_FIXTURE_VERSION;
  profile: CompilePerformanceFixtureProfile;
  entryCount: number;
  fileCount: number;
  sharedFileCount: number;
  privateFileCount: number;
  rootFileCount: number;
  totalBytes: number;
}

export interface CompilePerformanceFixture {
  parameters: CompilePerformanceFixtureParameters;
  entryNames: string[];
  files: CompilePerformanceFixtureFile[];
  sharedReferences: Record<string, string[]>;
}

export function createCompilePerformanceFixture(profile: CompilePerformanceFixtureProfile): CompilePerformanceFixture {
  const profileParameters = COMPILE_PERFORMANCE_FIXTURE_PROFILES[profile];
  const entryNames = Array.from({ length: profileParameters.entryCount }, (_, index) => formatEntryName(index));
  const sharedPaths = Array.from({ length: profileParameters.sharedFileCount }, (_, index) => formatSharedPath(index));
  const files: CompilePerformanceFixtureFile[] = [];
  const sharedReferences: Record<string, string[]> = Object.fromEntries(sharedPaths.map((path) => [path, []]));

  files.push({
    path: 'README.md',
    content: `# Compile performance ${profile} fixture\n`,
    language: 'markdown',
  });

  for (let entryIndex = 0; entryIndex < entryNames.length; entryIndex += 1) {
    const entryName = entryNames[entryIndex];
    const referencedSharedPaths = resolveSharedPaths(entryIndex, sharedPaths);
    for (const sharedPath of referencedSharedPaths) {
      sharedReferences[sharedPath].push(entryName);
    }

    files.push(
      ...createEntryFiles(
        entryName,
        entryIndex,
        privateFilesForEntry(profileParameters.privateFileCount, profileParameters.entryCount, entryIndex),
        referencedSharedPaths,
      ),
    );
  }

  for (let sharedIndex = 0; sharedIndex < sharedPaths.length; sharedIndex += 1) {
    files.push({
      path: sharedPaths[sharedIndex],
      content: `export const sharedValue${sharedIndex + 1} = 'shared-${padNumber(sharedIndex + 1)}';\n`,
      language: 'typescript',
    });
  }

  files.sort((left, right) => left.path.localeCompare(right.path));
  for (const entryNames of Object.values(sharedReferences)) {
    entryNames.sort();
  }

  assertFixtureShape(profile, files, entryNames);

  return {
    parameters: {
      fixtureVersion: COMPILE_PERFORMANCE_FIXTURE_VERSION,
      profile,
      ...profileParameters,
      totalBytes: files.reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0),
    },
    entryNames,
    files,
    sharedReferences,
  };
}

export function createSmallCompilePerformanceFixture(): CompilePerformanceFixture {
  return createCompilePerformanceFixture('small');
}

export function createMediumCompilePerformanceFixture(): CompilePerformanceFixture {
  return createCompilePerformanceFixture('medium');
}

function createEntryFiles(
  entryName: string,
  entryIndex: number,
  privateFilesPerEntry: number,
  sharedPaths: string[],
): CompilePerformanceFixtureFile[] {
  const rootPath = `src/client/js-blocks/${entryName}`;
  const sharedImports = sharedPaths
    .map(
      (path, index) =>
        `import { sharedValue${sharedValueNumber(path)} as shared${
          index + 1
        } } from '../../../shared/${basenameWithoutExtension(path)}';`,
    )
    .join('\n');

  const files: CompilePerformanceFixtureFile[] = [
    {
      path: `${rootPath}/entry.json`,
      content: `${JSON.stringify({ schemaVersion: 1, key: entryName, title: `Entry ${padNumber(entryIndex + 1)}` })}\n`,
      language: 'json',
    },
    {
      path: `${rootPath}/index.tsx`,
      content: [
        `import { privateValue } from './private-01';`,
        sharedImports,
        '',
        `ctx.render(<div>{[privateValue, shared1, shared2].join(':')}</div>);`,
        '',
      ].join('\n'),
      language: 'typescript',
    },
  ];

  for (let privateIndex = 0; privateIndex < privateFilesPerEntry; privateIndex += 1) {
    const fileNumber = privateIndex + 1;
    const nextFileNumber = fileNumber + 1;
    const hasNextFile = nextFileNumber <= privateFilesPerEntry;
    files.push({
      path: `${rootPath}/private-${padNumber(fileNumber)}.ts`,
      content: hasNextFile
        ? `import { privateValue as nextValue } from './private-${padNumber(
            nextFileNumber,
          )}';\nexport const privateValue = '${entryName}-${padNumber(fileNumber)}:' + nextValue;\n`
        : `export const privateValue = '${entryName}-${padNumber(fileNumber)}';\n`,
      language: 'typescript',
    });
  }

  return files;
}

function resolveSharedPaths(entryIndex: number, sharedPaths: string[]): string[] {
  if (sharedPaths.length < 2) {
    throw new Error('Compile performance fixtures require at least two shared files');
  }

  return [sharedPaths[entryIndex % sharedPaths.length], sharedPaths[(entryIndex + 1) % sharedPaths.length]];
}

function privateFilesForEntry(privateFileCount: number, entryCount: number, entryIndex: number): number {
  const minimumCount = Math.floor(privateFileCount / entryCount);
  return minimumCount + (entryIndex < privateFileCount % entryCount ? 1 : 0);
}

function assertFixtureShape(
  profile: CompilePerformanceFixtureProfile,
  files: CompilePerformanceFixtureFile[],
  entryNames: string[],
): void {
  const expected = COMPILE_PERFORMANCE_FIXTURE_PROFILES[profile];
  if (files.length !== expected.fileCount || entryNames.length !== expected.entryCount) {
    throw new Error(
      `Invalid ${profile} compile performance fixture: expected ${expected.entryCount} entries and ${expected.fileCount} files, received ${entryNames.length} entries and ${files.length} files`,
    );
  }
}

function formatEntryName(index: number): string {
  return `entry-${padNumber(index + 1)}`;
}

function formatSharedPath(index: number): string {
  return `src/shared/shared-${padNumber(index + 1)}.ts`;
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

function basenameWithoutExtension(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
}

function sharedValueNumber(path: string): number {
  const match = /shared-(\d+)\.ts$/.exec(path);
  if (!match) {
    throw new Error(`Invalid shared fixture path: ${path}`);
  }
  return Number(match[1]);
}
