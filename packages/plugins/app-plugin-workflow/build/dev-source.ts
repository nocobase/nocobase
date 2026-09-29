import { discoverWorkflowPackages } from './package-scanner.js';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { WorkflowSourceAst } from '../dsl/definition.js';
import type { WorkflowInstructionClass } from '../server/engine/types.js';
import type { WorkflowArtifactDefinition } from '../server/loader/artifact.js';

import { buildWorkflowArtifact } from './artifact-builder.js';
import {
  scanWorkflowPackage,
  WorkflowPackageScanError,
} from './package-scanner.js';
import { compileWorkflowSource } from './source-compiler.js';
import { WorkflowSourceCheckError } from './source-issues.js';
import {
  assertSerializableDefinition,
  isWorkflowSourceAst,
} from './source-serialization.js';
import { validateWorkflowSourceAst } from './source-validator.js';
import { collectWorkflowClientResources } from './client-resources.js';
import { buildWorkflowClientResources } from './client-build.js';

/**
 * Development-only compilation of an application's workflow source tree.
 *
 * This is `buildWorkflowPackage()` with two phases removed. It does not run
 * `ts.createProgram`, which is the expensive half of a build and which an editor
 * and `pnpm typecheck` already cover, and it evaluates the definition with a
 * plain `import()` instead of a disposable process, because a development server
 * already runs under a TypeScript loader. Schema validation, semantic validation,
 * flat IR compilation, and browser bundling use the build's code. Discovery
 * prepares immutable bytes in memory; enabling commits those exact bytes. The
 * digest is local to this artifact, and can differ from a production build
 * whose server modules have also been compiled.
 *
 * It is never reached from a production server: `WorkflowLoader` imports this
 * module dynamically and only when the runtime is not production.
 */
export interface WorkflowSourcePackage {
  readonly key: string;
  readonly digest: string;
  /** The source package root used during discovery only. */
  readonly directory: string;
  readonly workflow: WorkflowArtifactDefinition;
  /** Immutable bytes prepared during discovery and persisted only on materialization. */
  readonly files: ReadonlyMap<string, string | Uint8Array>;
}

export interface WorkflowSourceLoadOptions {
  readonly instructions: ReadonlyMap<string, WorkflowInstructionClass>;
}

const EXCLUDED_DIRECTORIES: ReadonlySet<string> = new Set([
  '.git',
  'node_modules',
  '.cache',
  'dist',
  'build',
]);

/**
 * A cheap fingerprint of the source tree, used to decide whether to recompile.
 *
 * It stats rather than reads, so it stays inexpensive enough to run on every
 * request that lists workflows, which is what lets an edit appear without a
 * server restart or a manual build.
 */
export async function workflowSourceSignature(
  sourceRoot: string,
): Promise<string> {
  const hash = createHash('sha256');
  const visit = async (directory: string, relative: string): Promise<void> => {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target, next);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = await fs.stat(target);
      hash.update(`${next}\0${stat.size}\0${stat.mtimeMs}\0`);
    }
  };
  await visit(sourceRoot, '');
  return hash.digest('hex');
}

/** Compile every workflow package under an application's workflow source root. */
export async function loadWorkflowSourcePackages(
  sourceRoot: string,
  options: WorkflowSourceLoadOptions,
): Promise<readonly WorkflowSourcePackage[]> {
  const packages: WorkflowSourcePackage[] = [];
  for (const packageRoot of await discoverWorkflowPackages(sourceRoot)) {
    packages.push(await loadWorkflowSourcePackage(packageRoot, options));
  }
  return packages;
}

/** Compile one workflow package from its source directory. */
export async function loadWorkflowSourcePackage(
  packageRoot: string,
  options: WorkflowSourceLoadOptions,
): Promise<WorkflowSourcePackage> {
  const scanned = await scanWorkflowPackage(packageRoot);
  const filePath = path.join(scanned.root, 'workflow.ts');
  const definitionEntry = scanned.entries.find(
    (entry) => entry.path === 'workflow.ts',
  );
  if (!definitionEntry)
    throw new WorkflowPackageScanError('workflow.ts is required', scanned.root);
  const ast = await evaluateWorkflowSource(filePath, definitionEntry.sha256);
  const contracts = {
    instructions: new Map(options.instructions),
  };
  const issues = validateWorkflowSourceAst(ast, filePath, contracts);
  if (issues.length > 0) throw new WorkflowSourceCheckError(issues);
  const clientResources = await collectWorkflowClientResources(
    scanned.root,
    ast,
    options.instructions,
  );
  const flatIr = compileWorkflowSource(ast, filePath, contracts);
  // A materialized development version uses the same browser artifact ABI as production.
  const browserFiles = await buildWorkflowClientResources(
    scanned.root,
    clientResources,
  );
  const resourceFiles = new Map<string, Uint8Array>();
  for (const entry of scanned.entries) {
    if (
      /^[a-f0-9]{64}\//.test(entry.path) ||
      entry.path === 'workflow.json' ||
      entry.path === 'package.json' ||
      entry.path.endsWith('.d.ts') ||
      entry.path.endsWith('.map') ||
      entry.path.startsWith('client/')
    )
      continue;
    resourceFiles.set(
      entry.path,
      await fs.readFile(path.join(scanned.root, entry.path)),
    );
  }
  for (const [name, bytes] of browserFiles)
    resourceFiles.set(
      name,
      typeof bytes === 'string' ? Buffer.from(bytes) : bytes,
    );
  const after = await scanWorkflowPackage(packageRoot);
  if (JSON.stringify(after.entries) !== JSON.stringify(scanned.entries))
    throw new Error(
      'Workflow source changed while preparing its snapshot; retry after saving.',
    );
  const built = buildWorkflowArtifact({
    key: scanned.key,
    flatIr,
    resourceFiles,
  });
  return {
    key: scanned.key,
    digest: built.digest,
    directory: scanned.root,
    workflow: built.workflow,
    files: built.files,
  };
}

/**
 * Import the definition, defeating the module cache so an edit is seen.
 *
 * The query keys the cache by the file's content hash, which the package scan
 * already computed: re-importing an unchanged file is free, an edited one is
 * always re-evaluated, and two edits landing in the same millisecond cannot
 * alias the way a timestamp would. The stale copies this leaves behind are
 * bounded by how many distinct versions a developer saves.
 */
async function evaluateWorkflowSource(
  filePath: string,
  contentHash: string,
): Promise<WorkflowSourceAst> {
  const url = pathToFileURL(filePath);
  url.searchParams.set('workflow-source', contentHash);
  let loaded: { default?: unknown };
  try {
    loaded = (await import(url.href)) as { default?: unknown };
  } catch (error) {
    throw evaluationError(
      filePath,
      error instanceof Error ? error.message : String(error),
    );
  }
  try {
    assertSerializableDefinition(loaded.default, 'workflow');
  } catch (error) {
    throw evaluationError(
      filePath,
      error instanceof Error ? error.message : String(error),
    );
  }
  if (!isWorkflowSourceAst(loaded.default))
    throw new WorkflowSourceCheckError([
      {
        phase: 'evaluate',
        code: 'INVALID_DEFAULT_EXPORT',
        message:
          'workflow.ts must default-export the value returned by defineWorkflow()',
        file: filePath,
        nodeKey: 'workflow',
        astPath: 'workflow',
        contractType: 'WorkflowSourceAst',
      },
    ]);
  return loaded.default;
}

function evaluationError(
  filePath: string,
  message: string,
): WorkflowSourceCheckError {
  return new WorkflowSourceCheckError([
    {
      phase: 'evaluate',
      code: 'EVALUATION_FAILED',
      message,
      file: filePath,
      nodeKey: 'workflow',
      astPath: 'workflow',
      contractType: 'WorkflowSourceAst',
    },
  ]);
}
