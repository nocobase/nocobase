import fs from 'node:fs/promises';
import path from 'node:path';
import { collectWorkflowClientResources } from './client-resources.js';
import { buildWorkflowClientResources } from './client-build.js';

import type { WorkflowFlatIr } from '../dsl/definition.js';
import type {
  JsonObject,
  JsonValue,
  WorkflowInstructionClass,
} from '../server/engine/types.js';
import {
  computeWorkflowArtifactDigest,
  type WorkflowArtifactDefinition,
} from '../server/loader/artifact.js';

export {
  computeWorkflowArtifactDigest,
  type WorkflowArtifactDefinition,
  type WorkflowArtifactDigestFile,
} from '../server/loader/artifact.js';

export interface WorkflowArtifactBuildInput {
  key: string;
  flatIr: WorkflowFlatIr;
  resourceFiles?: ReadonlyMap<string, string | Uint8Array>;
}

export interface WorkflowArtifactBuildResult {
  digest: string;
  workflow: WorkflowArtifactDefinition;
  files: ReadonlyMap<string, string | Uint8Array>;
}

export interface WorkflowPackageBuildOptions {
  instructions: Map<string, WorkflowInstructionClass>;
  /** Package root whose relative file layout is copied into the artifact. */
  resourceRoot?: string;
}

function normalizeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeJson(value[key])]),
    );
  }
  return value;
}

export function canonicalWorkflowJson(
  value: WorkflowArtifactDefinition,
): string {
  return `${JSON.stringify(normalizeJson(value as object as JsonObject), null, 2)}\n`;
}

export function buildWorkflowArtifact(
  input: WorkflowArtifactBuildInput,
): WorkflowArtifactBuildResult {
  const workflow: WorkflowArtifactDefinition = {
    formatVersion: 1,
    key: input.key,
    ...input.flatIr,
  };
  const files = new Map<string, string | Uint8Array>([
    ...(input.resourceFiles ?? new Map<string, string | Uint8Array>()),
    ['package.json', '{"type":"module"}\n'],
    ['workflow.json', canonicalWorkflowJson(workflow)],
  ]);
  return {
    digest: computeWorkflowArtifactDigest(
      [...files].map(([filePath, content]) => ({ path: filePath, content })),
    ),
    workflow,
    files,
  };
}

export async function buildWorkflowPackage(
  packageRoot: string,
  options: WorkflowPackageBuildOptions,
): Promise<WorkflowArtifactBuildResult> {
  const [
    { scanWorkflowPackage },
    { parseWorkflowSource },
    { validateWorkflowSourceAst },
    { compileWorkflowSource },
    { WorkflowSourceCheckError },
  ] = await Promise.all([
    import('./package-scanner.js'),
    import('./source-parser.js'),
    import('./source-validator.js'),
    import('./source-compiler.js'),
    import('./source-issues.js'),
  ]);
  const scanned = await scanWorkflowPackage(packageRoot);
  const filePath = path.join(scanned.root, 'workflow.ts');
  const parsed = await parseWorkflowSource(filePath);
  const issues = validateWorkflowSourceAst(parsed.ast, filePath, {
    instructions: options.instructions,
  });
  if (issues.length > 0) throw new WorkflowSourceCheckError(issues);
  const flatIr = compileWorkflowSource(parsed.ast, filePath, {
    instructions: options.instructions,
  });
  const clientResources = await collectWorkflowClientResources(
    scanned.root,
    parsed.ast,
    options.instructions,
  );
  const browserFiles = await buildWorkflowClientResources(
    scanned.root,
    clientResources,
  );
  const resourceFiles = await readWorkflowResourceFiles(
    options.resourceRoot ?? scanned.root,
  );
  for (const [name, bytes] of browserFiles) resourceFiles.set(name, bytes);
  return buildWorkflowArtifact({
    key: scanned.key,
    flatIr,
    resourceFiles,
  });
}

async function readWorkflowResourceFiles(
  resourceRoot: string,
): Promise<Map<string, string | Uint8Array>> {
  const { scanWorkflowPackage } = await import('./package-scanner.js');
  const scanned = await scanWorkflowPackage(resourceRoot);
  const files = new Map<string, string | Uint8Array>();
  for (const entry of scanned.entries) {
    if (
      /^[a-f0-9]{64}\//.test(entry.path) ||
      entry.path === 'workflow.json' ||
      entry.path === 'package.json' ||
      entry.path.endsWith('.d.ts') ||
      entry.path.endsWith('.map') ||
      entry.path === 'client' ||
      entry.path.startsWith('client/')
    )
      continue;
    files.set(
      entry.path,
      await fs.readFile(path.join(scanned.root, entry.path)),
    );
  }
  return files;
}

export async function writeWorkflowArtifact(
  result: WorkflowArtifactBuildResult,
  distRoot: string,
): Promise<string> {
  const keyRoot = path.join(distRoot, result.workflow.key);
  await fs.mkdir(distRoot, { recursive: true });
  const temporaryKeyRoot = await fs.mkdtemp(
    path.join(distRoot, `.${result.workflow.key}-tmp-`),
  );
  const temporaryDestination = path.join(temporaryKeyRoot, result.digest);
  for (const [relativePath, content] of result.files) {
    const target = path.join(temporaryDestination, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  await fs.rm(keyRoot, { recursive: true, force: true });
  await fs.rename(temporaryKeyRoot, keyRoot);
  return path.join(keyRoot, result.digest);
}
