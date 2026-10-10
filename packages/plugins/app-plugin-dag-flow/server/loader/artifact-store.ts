import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FsDriveDiskConfig } from '@nocobase/drive';
import {
  computeWorkflowArtifactDigest,
  type WorkflowArtifactDefinition,
  type WorkflowArtifactDigestFile,
} from './artifact.js';

export interface WorkflowArtifactStore {
  has(workflowKey: string, digest: string): Promise<boolean>;
  commit(workflowKey: string, digest: string, source: string): Promise<void>;
  materialize(workflowKey: string, digest: string): Promise<string>;
  readWorkflow(
    workflowKey: string,
    digest: string,
  ): Promise<WorkflowArtifactDefinition>;
}

export interface LocalWorkflowArtifactStoreOptions {
  storeRoot: string;
}

export class WorkflowArtifactIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowArtifactIntegrityError';
  }
}

function validatePart(value: string, label: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value))
    throw new WorkflowArtifactIntegrityError(`Invalid ${label} "${value}"`);
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export class LocalWorkflowArtifactStore implements WorkflowArtifactStore {
  constructor(private readonly options: LocalWorkflowArtifactStoreOptions) {}

  async has(workflowKey: string, digest: string): Promise<boolean> {
    const target = this.artifactPath(workflowKey, digest);
    if (!(await exists(target))) return false;
    await this.verifyDirectory(target, workflowKey, digest);
    return true;
  }

  async commit(
    workflowKey: string,
    digest: string,
    source: string,
  ): Promise<void> {
    await this.verifyDirectory(source, workflowKey, digest);
    const destination = this.artifactPath(workflowKey, digest);
    if (await exists(destination)) {
      await this.verifyDirectory(destination, workflowKey, digest);
      return;
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.tmp-${randomUUID()}`;
    try {
      await fs.cp(source, temporary, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      await this.verifyDirectory(temporary, workflowKey, digest);
      try {
        await fs.rename(temporary, destination);
      } catch (error) {
        if (
          (error as NodeJS.ErrnoException).code !== 'EEXIST' &&
          (error as NodeJS.ErrnoException).code !== 'ENOTEMPTY'
        )
          throw error;
        await this.verifyDirectory(destination, workflowKey, digest);
      }
    } finally {
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }

  async materialize(workflowKey: string, digest: string): Promise<string> {
    const directory = this.artifactPath(workflowKey, digest);
    await this.verifyDirectory(directory, workflowKey, digest);
    return directory;
  }

  async readWorkflow(
    workflowKey: string,
    digest: string,
  ): Promise<WorkflowArtifactDefinition> {
    const directory = await this.materialize(workflowKey, digest);
    return JSON.parse(
      await fs.readFile(path.join(directory, 'workflow.json'), 'utf8'),
    ) as WorkflowArtifactDefinition;
  }

  private artifactPath(workflowKey: string, digest: string): string {
    validatePart(workflowKey, 'workflow key');
    if (!/^[a-f0-9]{64}$/.test(digest))
      throw new WorkflowArtifactIntegrityError(
        `Invalid artifact digest "${digest}"`,
      );
    return path.join(this.options.storeRoot, 'workflows', workflowKey, digest);
  }

  private async verifyDirectory(
    directory: string,
    workflowKey: string,
    digest: string,
  ): Promise<void> {
    let workflow: WorkflowArtifactDefinition;
    try {
      workflow = JSON.parse(
        await fs.readFile(path.join(directory, 'workflow.json'), 'utf8'),
      ) as WorkflowArtifactDefinition;
    } catch (error) {
      throw new WorkflowArtifactIntegrityError(
        `Artifact ${workflowKey}/${digest} workflow.json cannot be read: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (workflow.formatVersion !== 1 || workflow.key !== workflowKey)
      throw new WorkflowArtifactIntegrityError(
        `Artifact ${workflowKey}/${digest} workflow.json is invalid`,
      );
    const files: WorkflowArtifactDigestFile[] = [];
    const visit = async (current: string, relative: string): Promise<void> => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const next = relative ? `${relative}/${entry.name}` : entry.name;
        const target = path.join(current, entry.name);
        if (entry.isDirectory()) await visit(target, next);
        else if (entry.isFile())
          files.push({ path: next, content: await fs.readFile(target) });
      }
    };
    await visit(directory, '');
    if (computeWorkflowArtifactDigest(files) !== digest)
      throw new WorkflowArtifactIntegrityError(
        `Artifact ${workflowKey}/${digest} bytes do not match its content address`,
      );
  }
}

export function createLocalWorkflowArtifactStore(
  disk: FsDriveDiskConfig,
  namespaceRoot?: string,
): WorkflowArtifactStore {
  if (disk.driver !== 'fs' || disk.visibility !== 'private')
    throw new Error('Workflow artifact disk must be a private fs/local disk');
  return new LocalWorkflowArtifactStore({
    storeRoot: namespaceRoot ?? disk.location,
  });
}
