import { discoverWorkflowPackages } from './package-scanner.js';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  coreInstructions,
  type WorkflowInstructionClass,
} from '../server/instructions/index.js';
import {
  buildWorkflowPackage,
  writeWorkflowArtifact,
} from './artifact-builder.js';

export {
  buildWorkflowArtifact,
  computeWorkflowArtifactDigest,
  writeWorkflowArtifact,
} from './artifact-builder.js';
export type {
  WorkflowArtifactBuildInput,
  WorkflowArtifactBuildResult,
  WorkflowArtifactDefinition,
  WorkflowArtifactDigestFile,
} from './artifact-builder.js';
export {
  loadWorkflowSourcePackage,
  loadWorkflowSourcePackages,
  workflowSourceSignature,
} from './dev-source.js';
export type {
  WorkflowSourceLoadOptions,
  WorkflowSourcePackage,
} from './dev-source.js';
export { checkWorkflowPackage } from './source-check.js';
export type {
  WorkflowSourceCheckOptions,
  WorkflowSourceCheckResult,
} from './source-check.js';
export { WorkflowSourceCheckError } from './source-issues.js';
export type {
  WorkflowSourceIssue,
  WorkflowSourcePhase,
} from './source-issues.js';

export interface ApplicationWorkflowBuildSummary {
  packages: number;
  artifacts: readonly string[];
}

export interface ApplicationWorkflowBuildOptions {
  sourceRoot: string;
  distRoot: string;
  /** Root containing the default build's package-relative runtime output. */
  resourceRoot?: string;
  instructions?: ReadonlyMap<string, WorkflowInstructionClass>;
}

/** Build every workflow package in an application's workflow source root. */
export async function buildApplicationWorkflows(
  options: ApplicationWorkflowBuildOptions,
): Promise<ApplicationWorkflowBuildSummary> {
  const { sourceRoot, distRoot } = options;
  const packageRoots = await discoverWorkflowPackages(sourceRoot);

  const instructions: Map<string, WorkflowInstructionClass> = new Map(
    options.instructions ?? coreInstructions,
  );
  const builtPackages = [];
  for (const packageRoot of packageRoots) {
    const packageName = path.basename(packageRoot);
    try {
      builtPackages.push(
        await buildWorkflowPackage(packageRoot, {
          instructions,
          resourceRoot: path.join(
            options.resourceRoot ?? sourceRoot,
            packageName,
          ),
        }),
      );
    } catch (error) {
      throw new Error(
        `Workflow package "${packageName}" at "${packageRoot}" failed to build: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  await fs.mkdir(distRoot, { recursive: true });
  for (const entry of await fs.readdir(distRoot, { withFileTypes: true })) {
    await fs.rm(path.join(distRoot, entry.name), {
      recursive: true,
      force: true,
    });
  }
  const artifacts: string[] = [];
  for (const built of builtPackages)
    artifacts.push(await writeWorkflowArtifact(built, distRoot));

  return { packages: packageRoots.length, artifacts };
}
