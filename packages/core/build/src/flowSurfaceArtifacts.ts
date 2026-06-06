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
const FLOW_SURFACE_ARTIFACT_SOURCE_GLOBS = [
  'src/client-v2/**/*.{ts,tsx,js,jsx,mjs}',
  '!src/client-v2/**/*.d.ts',
  ...globExcludeFiles,
];
const FLOW_SURFACE_ARTIFACT_SIGNAL_PATTERNS = [
  /\bFlowModel\b/,
  /\bModel\s*\.\s*define\s*\(/,
  /\bregisterModels\s*\(/,
  /\bregisterModelLoaders\s*\(/,
  /\bregisterFlow\s*\(/,
  /\bcreateModelOptions\b/,
  /\bAddSubModelButton\b/,
  /\bdefineChildren\s*\(/,
  /\bbuildSubModelItems?\s*\(/,
];

export function getFlowSurfaceArtifactDir(cwd: string) {
  return path.join(cwd, 'dist', FLOW_SURFACE_ARTIFACT_DIR);
}

export async function hasFlowSurfaceArtifactSignals(cwd: string) {
  const sourceFiles = fg.globSync(FLOW_SURFACE_ARTIFACT_SOURCE_GLOBS, {
    cwd,
    absolute: true,
    onlyFiles: true,
  });
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
  if (!(await hasFlowSurfaceArtifactSignals(cwd))) {
    return {
      status: 'skipped-no-signals',
    };
  }

  log('flow surface snapshot artifact');
  try {
    const packageJson = getPackageJson(cwd);
    const packageName = typeof packageJson.name === 'string' ? packageJson.name.trim() : '';
    if (!packageName) {
      return {
        status: 'failed',
        error: 'package name is missing',
      };
    }
    const runExtractor = options.runExtractor || loadFlowSurfaceExtractorRunner();
    const summary = await runExtractor(
      [
        {
          plugin: packageName,
          packageRoot: cwd,
        },
      ],
      {
        outDir: getFlowSurfaceArtifactDir(cwd),
        preferMode: 'source',
        extractorVersion: '@nocobase/build:flow-surfaces-artifact@1',
      },
    );
    if (!summary.ok) {
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
    const message = error instanceof Error ? error.message : String(error);
    log('flow surface snapshot artifact skipped: %s', message);
    return {
      status: 'failed',
      error: message,
    };
  }
}

function loadFlowSurfaceExtractorRunner(): FlowSurfaceExtractorRunner {
  const candidates = [
    path.join(
      ROOT_PATH,
      'packages/plugins/@nocobase/plugin-flow-engine/src/server/flow-surfaces/extractor/cli.ts',
    ),
    path.join(
      ROOT_PATH,
      'packages/plugins/@nocobase/plugin-flow-engine/dist/server/flow-surfaces/extractor/cli.js',
    ),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const loaded = requireFlowSurfaceExtractor(candidate);
    if (isFlowSurfaceExtractorRunner(loaded?.runFlowSurfaceExtractorCli)) {
      return loaded.runFlowSurfaceExtractorCli;
    }
  }
  throw new Error('Flow surface extractor runner is not available');
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
