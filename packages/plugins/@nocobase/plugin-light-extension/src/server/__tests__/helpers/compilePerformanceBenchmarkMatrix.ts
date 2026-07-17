/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionCompileMetricResult } from '../../../shared/compileMetrics';
import type { CompilePerformanceFixtureFile, CompilePerformanceFixtureProfile } from './compilePerformanceFixture';
import { createCompilePerformanceFixture } from './compilePerformanceFixture';

export const COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION = 1 as const;
export const COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS = 1 as const;
export const COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS = 20 as const;

export const COMPILE_PERFORMANCE_BENCHMARK_SCENARIO_IDS = [
  'small-private-file',
  'medium-private-file',
  'medium-single-consumer-shared-file',
  'medium-unused-shared-file',
  'medium-descriptor-metadata',
  'medium-readme',
  'medium-compile-failure',
  'medium-concurrent-same-head',
] as const;

export type CompilePerformanceBenchmarkScenarioId = (typeof COMPILE_PERFORMANCE_BENCHMARK_SCENARIO_IDS)[number];

export interface CompilePerformanceBenchmarkFixtureRoles {
  descriptorPath: string;
  failingEntryPath: string;
  privateFilePath: string;
  readmePath: string;
  singleConsumerSharedFilePath: string;
  unusedSharedFilePath?: string;
}

export interface CompilePerformanceBenchmarkFixture {
  fixtureVersion: number;
  profile: CompilePerformanceFixtureProfile;
  entryCount: number;
  fileCount: number;
  totalBytes: number;
  files: CompilePerformanceFixtureFile[];
  entryNames: string[];
  sharedReferences: Record<string, string[]>;
  roles: CompilePerformanceBenchmarkFixtureRoles;
}

export interface CompilePerformanceBenchmarkStructuralExpectation {
  affectedEntryCount?: number;
  compiledEntryCount?: number;
  compiledEntryCountMax?: number;
  requireUncompiledEntriesReusedOrSkipped?: boolean;
  blobContentQueryCountMax: number;
  snapshotMaterializationCountMax: number;
  treeNormalizationCountMax: number;
}

export interface CompilePerformanceBenchmarkFunctionalExpectation {
  rollbackRequired?: boolean;
  successfulRequestCount?: number;
  outdatedRequestCount?: number;
}

export interface CompilePerformanceBenchmarkScenario {
  id: CompilePerformanceBenchmarkScenarioId;
  title: string;
  fixtureProfile: CompilePerformanceFixtureProfile;
  coldRuns: number;
  hotRuns: number;
  expectedResult: LightExtensionCompileMetricResult;
  structural: CompilePerformanceBenchmarkStructuralExpectation;
  dependencyGraphStructural?: CompilePerformanceBenchmarkStructuralExpectation;
  functional: CompilePerformanceBenchmarkFunctionalExpectation;
}

export interface CompilePerformanceBenchmarkChange {
  path: string;
  content: string;
  language: string;
}

export interface CompilePerformanceBenchmarkMutation {
  primary: CompilePerformanceBenchmarkChange[];
  concurrent?: CompilePerformanceBenchmarkChange[];
}

const MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION = {
  blobContentQueryCountMax: 1,
  snapshotMaterializationCountMax: 1,
  treeNormalizationCountMax: 1,
} as const;

export function createCompilePerformanceBenchmarkMatrix(): CompilePerformanceBenchmarkScenario[] {
  return [
    {
      id: 'small-private-file',
      title: 'Small repository: change one Entry private file',
      fixtureProfile: 'small',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 1,
        compiledEntryCountMax: 1,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-private-file',
      title: 'Medium repository: change one Entry private file',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 1,
        compiledEntryCountMax: 1,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-single-consumer-shared-file',
      title: 'Medium repository: change a shared file used by one Entry',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        compiledEntryCountMax: 20,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      dependencyGraphStructural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 1,
        compiledEntryCountMax: 1,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-unused-shared-file',
      title: 'Medium repository: change an unused shared file',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        compiledEntryCountMax: 20,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      dependencyGraphStructural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 0,
        compiledEntryCount: 0,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-descriptor-metadata',
      title: 'Medium repository: change descriptor display metadata only',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 0,
        compiledEntryCount: 0,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-readme',
      title: 'Medium repository: change README only',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 0,
        compiledEntryCount: 0,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: {},
    },
    {
      id: 'medium-compile-failure',
      title: 'Medium repository: reject one Entry compile failure and roll back globally',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'rejected',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
      },
      functional: { rollbackRequired: true },
    },
    {
      id: 'medium-concurrent-same-head',
      title: 'Medium repository: two clients save from the same Head',
      fixtureProfile: 'medium',
      coldRuns: COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
      hotRuns: COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
      expectedResult: 'success',
      structural: {
        ...MEDIUM_DEFAULT_STRUCTURAL_EXPECTATION,
        affectedEntryCount: 1,
        compiledEntryCountMax: 1,
        requireUncompiledEntriesReusedOrSkipped: true,
      },
      functional: { successfulRequestCount: 1, outdatedRequestCount: 1 },
    },
  ];
}

export function createCompilePerformanceBenchmarkFixture(
  profile: CompilePerformanceFixtureProfile,
): CompilePerformanceBenchmarkFixture {
  const fixture = createCompilePerformanceFixture(profile);
  const files = fixture.files.map((file) => ({ ...file }));
  if (profile === 'medium') {
    replaceFileContent(files, 'src/client/js-blocks/entry-19/index.tsx', createEntryIndexContent(18, 19));
    replaceFileContent(files, 'src/client/js-blocks/entry-20/index.tsx', createEntryIndexContent(2, 3));
  }
  const sharedReferences = collectSharedReferences(files, fixture.entryNames);

  return {
    fixtureVersion: fixture.parameters.fixtureVersion,
    profile,
    entryCount: fixture.parameters.entryCount,
    fileCount: fixture.parameters.fileCount,
    totalBytes: files.reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0),
    files,
    entryNames: [...fixture.entryNames],
    sharedReferences,
    roles: {
      descriptorPath: 'src/client/js-blocks/entry-01/entry.json',
      failingEntryPath: 'src/client/js-blocks/entry-01/index.tsx',
      privateFilePath: 'src/client/js-blocks/entry-01/private-01.ts',
      readmePath: 'README.md',
      singleConsumerSharedFilePath: 'src/shared/shared-01.ts',
      unusedSharedFilePath: profile === 'medium' ? 'src/shared/shared-20.ts' : undefined,
    },
  };
}

export function createCompilePerformanceBenchmarkMutation(
  fixture: CompilePerformanceBenchmarkFixture,
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  iteration: number,
): CompilePerformanceBenchmarkMutation {
  if (!Number.isSafeInteger(iteration) || iteration < 1) {
    throw new RangeError('Benchmark iteration must be a positive integer');
  }
  const revision = String(iteration).padStart(2, '0');

  switch (scenarioId) {
    case 'small-private-file':
    case 'medium-private-file':
      assertFixtureProfile(scenarioId, fixture.profile, scenarioId.startsWith('small-') ? 'small' : 'medium');
      return {
        primary: [
          createChange(
            fixture,
            fixture.roles.privateFilePath,
            `export const privateValue = 'benchmark-private-${revision}';\n`,
          ),
        ],
      };
    case 'medium-single-consumer-shared-file':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [
          createChange(
            fixture,
            fixture.roles.singleConsumerSharedFilePath,
            `export const sharedValue1 = 'benchmark-single-consumer-${revision}';\n`,
          ),
        ],
      };
    case 'medium-unused-shared-file':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [
          createChange(
            fixture,
            requireFixtureRole(fixture.roles.unusedSharedFilePath, 'unused shared file'),
            `export const sharedValue20 = 'benchmark-unused-${revision}';\n`,
          ),
        ],
      };
    case 'medium-descriptor-metadata':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [
          createChange(
            fixture,
            fixture.roles.descriptorPath,
            `${JSON.stringify({ schemaVersion: 1, key: 'entry-01', title: `Benchmark metadata ${revision}` })}\n`,
          ),
        ],
      };
    case 'medium-readme':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [createChange(fixture, fixture.roles.readmePath, `# Compile performance benchmark ${revision}\n`)],
      };
    case 'medium-compile-failure':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [
          createChange(
            fixture,
            fixture.roles.failingEntryPath,
            `import Missing${revision} from './missing-${revision}';\nctx.render(<Missing${revision} />);\n`,
          ),
        ],
      };
    case 'medium-concurrent-same-head':
      assertFixtureProfile(scenarioId, fixture.profile, 'medium');
      return {
        primary: [
          createChange(
            fixture,
            fixture.roles.privateFilePath,
            `export const privateValue = 'benchmark-concurrent-primary-${revision}';\n`,
          ),
        ],
        concurrent: [createChange(fixture, fixture.roles.readmePath, `# Concurrent benchmark contender ${revision}\n`)],
      };
  }
}

function createEntryIndexContent(firstSharedNumber: number, secondSharedNumber: number): string {
  return [
    `import { privateValue } from './private-01';`,
    `import { sharedValue${firstSharedNumber} as shared1 } from '../../../shared/shared-${String(
      firstSharedNumber,
    ).padStart(2, '0')}';`,
    `import { sharedValue${secondSharedNumber} as shared2 } from '../../../shared/shared-${String(
      secondSharedNumber,
    ).padStart(2, '0')}';`,
    '',
    `ctx.render(<div>{[privateValue, shared1, shared2].join(':')}</div>);`,
    '',
  ].join('\n');
}

function replaceFileContent(files: CompilePerformanceFixtureFile[], path: string, content: string): void {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Benchmark fixture file not found: ${path}`);
  }
  file.content = content;
}

function collectSharedReferences(
  files: CompilePerformanceFixtureFile[],
  entryNames: string[],
): Record<string, string[]> {
  const sharedPaths = files.filter((file) => file.path.startsWith('src/shared/')).map((file) => file.path);
  const references = Object.fromEntries(sharedPaths.map((path) => [path, []])) as Record<string, string[]>;
  for (const entryName of entryNames) {
    const indexFile = files.find((file) => file.path === `src/client/js-blocks/${entryName}/index.tsx`);
    if (!indexFile) {
      throw new Error(`Benchmark fixture Entry index not found: ${entryName}`);
    }
    for (const match of indexFile.content.matchAll(/\.\.\/\.\.\/\.\.\/shared\/(shared-\d{2})/g)) {
      const sharedPath = `src/shared/${match[1]}.ts`;
      if (!references[sharedPath]) {
        throw new Error(`Benchmark fixture references an unknown shared file: ${sharedPath}`);
      }
      references[sharedPath].push(entryName);
    }
  }
  return references;
}

function createChange(
  fixture: CompilePerformanceBenchmarkFixture,
  path: string,
  content: string,
): CompilePerformanceBenchmarkChange {
  const source = fixture.files.find((file) => file.path === path);
  if (!source) {
    throw new Error(`Benchmark mutation file not found: ${path}`);
  }
  return { path, content, language: source.language };
}

function assertFixtureProfile(
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  actual: CompilePerformanceFixtureProfile,
  expected: CompilePerformanceFixtureProfile,
): void {
  if (actual !== expected) {
    throw new Error(`Benchmark scenario "${scenarioId}" requires the ${expected} fixture`);
  }
}

function requireFixtureRole(path: string | undefined, role: string): string {
  if (!path) {
    throw new Error(`Benchmark fixture does not define the ${role} role`);
  }
  return path;
}
