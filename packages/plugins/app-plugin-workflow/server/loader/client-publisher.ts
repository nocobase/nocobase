import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { WorkflowArtifactStore } from './artifact-store.js';

interface ClientManifest {
  formatVersion: number;
  hostAbi: number;
  entries: Record<string, { js: string; css: string[] }>;
  files: string[];
}

function validFile(name: string): boolean {
  return (
    /^client\/[a-zA-Z0-9._/-]+$/.test(name) &&
    !name.split('/').some((part) => part === '..' || part === '.')
  );
}

export async function publishWorkflowClientArtifact(
  store: WorkflowArtifactStore,
  clientDir: string,
  key: string,
  digest: string,
): Promise<void> {
  const root = await store.materialize(key, digest);
  const manifestPath = path.join(root, 'client/manifest.json');
  let manifest: ClientManifest;
  try {
    manifest = JSON.parse(
      await fs.readFile(manifestPath, 'utf8'),
    ) as ClientManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const workflow = await store.readWorkflow(key, digest);
      if (workflow.client?.inputForm || workflow.client?.parameterForm)
        throw new Error(
          `Workflow Artifact ${key}/${digest} declares a client resource without a manifest`,
          { cause: error },
        );
      return;
    }
    throw new Error(
      `Workflow client manifest cannot be read for ${key}/${digest}`,
      { cause: error },
    );
  }
  if (
    manifest.formatVersion !== 1 ||
    manifest.hostAbi !== 1 ||
    !Array.isArray(manifest.files)
  )
    throw new Error(
      `Invalid client manifest in Workflow Artifact ${key}/${digest}`,
    );
  const listed = new Set(manifest.files);
  for (const file of listed)
    if (!validFile(file))
      throw new Error(
        `Invalid client file ${file} in Workflow Artifact ${key}/${digest}`,
      );
  for (const entry of Object.values(manifest.entries)) {
    if (!listed.has(entry.js) || !entry.css.every((file) => listed.has(file)))
      throw new Error(
        `Client entry references an unlisted file in Workflow Artifact ${key}/${digest}`,
      );
  }
  const destination = path.join(clientDir, 'assets/workflow-artifacts', digest);
  const matches = async (): Promise<boolean> => {
    try {
      if (
        (await fs.readFile(
          path.join(destination, 'client/manifest.json'),
          'utf8',
        )) !== (await fs.readFile(manifestPath, 'utf8'))
      )
        return false;
      for (const file of listed) {
        const [source, published] = await Promise.all([
          fs.readFile(path.join(root, file)),
          fs.readFile(path.join(destination, file)),
        ]);
        if (!source.equals(published)) return false;
      }
      return true;
    } catch {
      return false;
    }
  };
  if (await matches()) return;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${randomUUID()}`;
  try {
    for (const file of listed) {
      const source = path.join(root, file);
      const real = await fs.realpath(source);
      if (!real.startsWith(`${root}${path.sep}`))
        throw new Error(`Client resource escapes Artifact: ${file}`);
      const target = path.join(temporary, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(real, target);
    }
    await fs.mkdir(path.join(temporary, 'client'), { recursive: true });
    await fs.copyFile(
      manifestPath,
      path.join(temporary, 'client/manifest.json'),
    );
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}
