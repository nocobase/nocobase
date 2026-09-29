import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseManager } from '@nocobase/db';
import {
  asId,
  type WorkflowId,
  type WorkflowInstructionClass,
} from '../engine/index.js';

import { workflowStore, type WorkflowStore } from '../collections/store.js';

import type { WorkflowArtifactStore } from './artifact-store.js';
import { publishWorkflowClientArtifact } from './client-publisher.js';
import {
  discoverWorkflowDistArtifacts,
  WorkflowPublisher,
  type WorkflowDistArtifact,
} from './synchronizer.js';

/**
 * Development-only discovery of workflow packages from their source tree.
 *
 * Providing this makes the loader read `workflows` directly instead of
 * the built Artifacts under `dist/workflows`, so an edited `workflow.ts`
 * is visible without running `nocobase workflow build` first. The compilation
 * itself lives behind the build boundary and is reached by dynamic import, so
 * a production runtime never loads it.
 */
export interface WorkflowSourceDiscoveryOptions {
  root: string;
  /**
   * The instruction set to validate against, read at discovery time.
   *
   * A function rather than a map because plugins may register instructions
   * after the loader is constructed, and development discovery should see the
   * same contracts the engine will execute with.
   */
  instructions: () => ReadonlyMap<string, WorkflowInstructionClass>;
}

export interface WorkflowLoaderOptions {
  database: DatabaseManager;
  artifactStore: WorkflowArtifactStore;
  distRoot: string;
  clientDir?: string;
  source?: WorkflowSourceDiscoveryOptions;
}

export class WorkflowLoader {
  private readonly publisher: WorkflowPublisher;
  private readonly locks = new Map<string, Promise<void>>();
  private discovered?: Promise<readonly WorkflowDistArtifact[]>;
  private sourceCache?: {
    signature: string;
    artifacts: readonly WorkflowDistArtifact[];
  };

  constructor(private readonly options: WorkflowLoaderOptions) {
    this.publisher = new WorkflowPublisher({
      database: options.database,
      artifactStore: options.artifactStore,
    });
  }

  private get store(): WorkflowStore {
    return workflowStore(this.options.database);
  }

  discover(): Promise<readonly WorkflowDistArtifact[]> {
    const source = this.options.source;
    if (source) return this.discoverDevelopment(source);
    return this.discoverDist();
  }

  /** Persist deployment resources without creating or activating DB revisions. */
  async synchronizeDeploymentArtifacts(): Promise<void> {
    if (this.options.source) {
      await this.restoreClientArtifacts();
      return;
    }
    for (const artifact of await this.discover())
      await this.withKeyLock(artifact.key, async () => {
        await this.persistArtifact(artifact);
        await this.publishClientArtifact(artifact.key, artifact.digest);
      });
    await this.restoreClientArtifacts();
  }

  private async persistArtifact(artifact: WorkflowDistArtifact): Promise<void> {
    const stored = await this.options.artifactStore.has(
      artifact.key,
      artifact.digest,
    );
    if (stored) return;
    if (!artifact.files) {
      await this.options.artifactStore.commit(
        artifact.key,
        artifact.digest,
        artifact.directory,
      );
      return;
    }
    const temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-snapshot-'),
    );
    try {
      for (const [name, bytes] of artifact.files) {
        const target = path.join(temporary, name);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, bytes);
      }
      await this.options.artifactStore.commit(
        artifact.key,
        artifact.digest,
        temporary,
      );
    } finally {
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }

  private async publishClientArtifact(
    key: string,
    digest: string,
  ): Promise<void> {
    if (this.options.clientDir)
      await publishWorkflowClientArtifact(
        this.options.artifactStore,
        this.options.clientDir,
        key,
        digest,
      );
  }

  async restoreClientArtifacts(): Promise<void> {
    if (!this.options.clientDir) return;
    const rows = await this.store.workflows.findMany({
      select: (select) => select.fields('key', 'hash'),
    });
    const references = new Set(
      rows.flatMap((row) =>
        typeof row.key === 'string' && typeof row.hash === 'string'
          ? [`${row.key}:${row.hash}`]
          : [],
      ),
    );
    for (const reference of references) {
      const separator = reference.lastIndexOf(':');
      const key = reference.slice(0, separator);
      const digest = reference.slice(separator + 1);
      if (await this.options.artifactStore.has(key, digest))
        await this.publishClientArtifact(key, digest);
    }
  }

  /** Persist and publish resources before creating a DB revision; do not activate it. */
  async ensureMaterialized(digest: string): Promise<WorkflowId | undefined> {
    // Existing ids must remain usable even if the current source no longer builds.
    const existing = await this.store.workflows.findOne({
      filter: { hash: digest },
      select: (select) => select.fields('id', 'key'),
    });
    const existingKey = existing?.key;
    if (
      existing &&
      typeof existingKey === 'string' &&
      (await this.options.artifactStore.has(existingKey, digest))
    ) {
      await this.withKeyLock(existingKey, () =>
        this.publishClientArtifact(existingKey, digest),
      );
      return asId(existing.id);
    }
    const artifact = (await this.discover()).find(
      (item) => item.digest === digest,
    );
    if (!artifact) return undefined;
    return this.withKeyLock(artifact.key, async () => {
      const store = this.store;
      const found = await store.workflows.findOne({
        filter: { key: artifact.key, hash: artifact.digest },
        select: (select) => select.fields('id'),
      });
      await this.persistArtifact(artifact);
      await this.publishClientArtifact(artifact.key, artifact.digest);
      if (found) return asId(found.id);
      const result = await this.publisher.registerArtifact(artifact);
      return result.workflowId;
    });
  }

  private discoverDist(): Promise<readonly WorkflowDistArtifact[]> {
    // Built Artifacts are content-addressed and immutable for the life of the
    // process, so one scan is enough.
    this.discovered ??= discoverWorkflowDistArtifacts(this.options.distRoot);
    return this.discovered;
  }

  /**
   * Source wins over a built Artifact for the same key, and a key that exists
   * only under `dist` is still offered, so a tree left behind by an earlier
   * `nocobase workflow build` keeps working.
   */
  private async discoverDevelopment(
    source: WorkflowSourceDiscoveryOptions,
  ): Promise<readonly WorkflowDistArtifact[]> {
    const byKey = new Map<string, WorkflowDistArtifact>();
    for (const artifact of await this.discoverDistLeniently())
      byKey.set(artifact.key, artifact);
    for (const artifact of await this.discoverSource(source))
      byKey.set(artifact.key, artifact);
    return [...byKey.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }

  /**
   * In development the source tree is the truth, so a stale or half-written
   * `dist/workflows` must not be able to stop the server from seeing it.
   */
  private async discoverDistLeniently(): Promise<
    readonly WorkflowDistArtifact[]
  > {
    try {
      return await this.discoverDist();
    } catch {
      this.discovered = Promise.resolve([]);
      return [];
    }
  }

  private async discoverSource(
    source: WorkflowSourceDiscoveryOptions,
  ): Promise<readonly WorkflowDistArtifact[]> {
    const { loadWorkflowSourcePackages, workflowSourceSignature } =
      await import('../../build/dev-source.js');
    const signature = await workflowSourceSignature(source.root);
    if (this.sourceCache?.signature === signature)
      return this.sourceCache.artifacts;
    const artifacts = (
      await loadWorkflowSourcePackages(source.root, {
        instructions: source.instructions(),
      })
    ).map((workflowPackage) => ({
      ...workflowPackage,
      origin: 'source' as const,
    }));
    this.sourceCache = { signature, artifacts };
    return artifacts;
  }

  private async withKeyLock<T>(
    key: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(key, current);
    await previous;
    try {
      return await task();
    } finally {
      release();
      if (this.locks.get(key) === current) this.locks.delete(key);
    }
  }
}
