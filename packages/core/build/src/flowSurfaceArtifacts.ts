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
import { register } from 'esbuild-register/dist/node';
import { ROOT_PATH, globExcludeFiles } from './constant';
import { getPackageJson, PkgLog } from './utils';

type FlowSurfaceExtractorTarget = {
  plugin: string;
  packageRoot?: string;
  sourceEntry?: string;
  sourceRoot?: string;
};

type FlowSurfaceExtractorResult = {
  ok: boolean;
  plugin: string;
  snapshotPath?: string;
  eventCount: number;
  candidateCount: number;
  warningCount: number;
  errors?: Array<{
    code: string;
    message: string;
  }>;
};

type FlowSurfaceExtractorSummary = {
  ok: boolean;
  dryRun: boolean;
  results: FlowSurfaceExtractorResult[];
  exitCode: 0 | 1;
};

type FlowSurfaceExtractorRunner = (
  targets: FlowSurfaceExtractorTarget[],
  options: {
    dryRun?: boolean;
    outDir?: string;
    preferMode?: 'source' | 'dist';
    generatedAt?: string;
    extractorVersion?: string;
  },
) => Promise<FlowSurfaceExtractorSummary>;

type BuildFlowSurfaceArtifactOptions = {
  runExtractor?: FlowSurfaceExtractorRunner;
};

type FlowSurfaceArtifactBuildResult =
  | {
      status: 'skipped-no-signals';
    }
  | {
      status: 'generated' | 'failed';
      summary?: FlowSurfaceExtractorSummary;
      error?: string;
    };

const FLOW_SURFACE_ARTIFACT_DIR = 'flow-surfaces-capabilities';
const CORE_CLIENT_V2_PACKAGE = '@nocobase/client-v2';
const DEFAULT_FLOW_SURFACE_ARTIFACT_GENERATED_AT = new Date(0).toISOString();
const FLOW_SURFACE_ARTIFACT_SIGNAL_PATTERNS = [
  /\bFlowModel\b/,
  /\bModel\s*\.\s*define\s*\(/,
  /\bbindModelToInterface\s*\(/,
  /\bregisterModels\s*\(/,
  /\bregisterModelLoaders\s*\(/,
  /\bregisterFlow\s*\(/,
  /\bcreateModelOptions\b/,
  /\bAddSubModelButton\b/,
  /\bdefineChildren\s*\(/,
  /\bbuildSubModelItems?\s*\(/,
];

export function getFlowSurfaceArtifactDir(cwd: string, packageName?: string) {
  return path.join(cwd, packageName === CORE_CLIENT_V2_PACKAGE ? 'es' : 'dist', FLOW_SURFACE_ARTIFACT_DIR);
}

export async function hasFlowSurfaceArtifactSignals(cwd: string, sourceRoot = 'src/client-v2') {
  const sourceFiles = fg.globSync(
    [`${sourceRoot}/**/*.{ts,tsx,js,jsx,mjs}`, `!${sourceRoot}/**/*.d.ts`, ...globExcludeFiles],
    {
      cwd,
      absolute: true,
      onlyFiles: true,
    },
  );
  for (const sourceFile of sourceFiles) {
    let source = '';
    try {
      source = await fs.readFile(sourceFile, 'utf8');
    } catch {
      continue;
    }
    if (FLOW_SURFACE_ARTIFACT_SIGNAL_PATTERNS.some((pattern) => pattern.test(source))) {
      return true;
    }
  }
  return false;
}

export async function buildFlowSurfaceArtifact(
  cwd: string,
  log: PkgLog,
  options: BuildFlowSurfaceArtifactOptions = {},
): Promise<FlowSurfaceArtifactBuildResult> {
  let outDir: string | undefined;
  try {
    const packageJson = getPackageJson(cwd);
    const packageName = typeof packageJson.name === 'string' ? packageJson.name.trim() : '';
    if (!packageName) {
      return {
        status: 'failed',
        error: 'package name is missing',
      };
    }
    const sourceRoot = packageName === CORE_CLIENT_V2_PACKAGE ? 'src' : 'src/client-v2';
    outDir = getFlowSurfaceArtifactDir(cwd, packageName);
    if (!(await hasFlowSurfaceArtifactSignals(cwd, sourceRoot))) {
      await fs.remove(outDir);
      return {
        status: 'skipped-no-signals',
      };
    }

    log('flow surface snapshot artifact');
    await fs.remove(outDir);
    const runExtractor = options.runExtractor || loadFlowSurfaceExtractorRunner(cwd);
    const summary = await runExtractor(
      [
        {
          plugin: packageName,
          packageRoot: cwd,
          ...(packageName === CORE_CLIENT_V2_PACKAGE
            ? {
                sourceEntry: 'src/index.ts',
                sourceRoot,
              }
            : {}),
        },
      ],
      {
        outDir,
        preferMode: 'source',
        generatedAt: getFlowSurfaceArtifactGeneratedAt(),
        extractorVersion: '@nocobase/build:flow-surfaces-artifact@1',
      },
    );
    if (!summary.ok) {
      await fs.remove(outDir);
      log('flow surface snapshot artifact skipped after extractor failure');
      return {
        status: 'failed',
        summary,
      };
    }
    return {
      status: 'generated',
      summary,
    };
  } catch (error) {
    if (outDir) {
      await fs.remove(outDir);
    }
    const message = error instanceof Error ? error.message : String(error);
    log('flow surface snapshot artifact skipped: %s', message);
    return {
      status: 'failed',
      error: message,
    };
  }
}

function loadFlowSurfaceExtractorRunner(cwd: string): FlowSurfaceExtractorRunner {
  const candidates = getFlowSurfaceExtractorRunnerCandidates(cwd);
  let lastError: unknown;
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    let loaded: any;
    try {
      loaded = requireFlowSurfaceExtractor(candidate);
    } catch (error) {
      lastError = error;
      continue;
    }
    if (isFlowSurfaceExtractorRunner(loaded?.runFlowSurfaceExtractorCli)) {
      return loaded.runFlowSurfaceExtractorCli;
    }
  }
  const detail = lastError instanceof Error ? `: ${lastError.message}` : '';
  throw new Error(`Flow surface extractor runner is not available${detail}`);
}

function getFlowSurfaceExtractorRunnerCandidates(cwd: string) {
  const packageRoots = new Set<string>();
  try {
    if (getPackageJson(cwd).name === '@nocobase/plugin-flow-engine') {
      packageRoots.add(cwd);
    }
  } catch {
    // Continue with installed and monorepo package resolution.
  }
  try {
    packageRoots.add(path.dirname(require.resolve('@nocobase/plugin-flow-engine/package.json', { paths: [cwd] })));
  } catch {
    // The monorepo source fallback below remains available during bootstrap builds.
  }
  packageRoots.add(path.join(ROOT_PATH, 'packages/plugins/@nocobase/plugin-flow-engine'));
  return Array.from(packageRoots).flatMap((packageRoot) => [
    path.join(packageRoot, 'src/server/flow-surfaces/extractor/cli.ts'),
    path.join(packageRoot, 'dist/server/flow-surfaces/extractor/cli.js'),
  ]);
}

function getFlowSurfaceArtifactGeneratedAt() {
  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  if (!sourceDateEpoch) {
    return DEFAULT_FLOW_SURFACE_ARTIFACT_GENERATED_AT;
  }
  const epochSeconds = Number(sourceDateEpoch);
  if (!Number.isFinite(epochSeconds) || epochSeconds < 0) {
    return DEFAULT_FLOW_SURFACE_ARTIFACT_GENERATED_AT;
  }
  const generatedAt = new Date(epochSeconds * 1000);
  return Number.isNaN(generatedAt.getTime()) ? DEFAULT_FLOW_SURFACE_ARTIFACT_GENERATED_AT : generatedAt.toISOString();
}

function requireFlowSurfaceExtractor(filePath: string) {
  if (!filePath.endsWith('.ts')) {
    return require(filePath);
  }
  const { unregister } = register({});
  try {
    return require(filePath);
  } finally {
    unregister();
  }
}

function isFlowSurfaceExtractorRunner(value: unknown): value is FlowSurfaceExtractorRunner {
  return typeof value === 'function';
}
