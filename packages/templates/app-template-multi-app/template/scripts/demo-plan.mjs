import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

/** Validate the complete operator plan before any deployment or membership write. */
export async function readDemoPlan(file) {
  const absolute = path.resolve(file);
  const plan = JSON.parse(await readFile(absolute, 'utf8'));
  if (!Array.isArray(plan.artifacts) || plan.artifacts.length === 0)
    throw new Error(
      'The demo plan needs at least one { version, path } artifact.',
    );
  const versions = new Set();
  const artifacts = [];
  for (const artifact of plan.artifacts) {
    if (
      typeof artifact.version !== 'string' ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(artifact.version) ||
      versions.has(artifact.version)
    )
      throw new Error('Artifact versions must be unique semantic versions.');
    if (typeof artifact.path !== 'string' || !artifact.path.trim())
      throw new Error('Each artifact needs an explicit archive path.');
    const archive = await realpath(
      path.resolve(path.dirname(absolute), artifact.path),
    );
    if (!(await stat(archive)).isFile())
      throw new Error('An artifact must be a regular file.');
    versions.add(artifact.version);
    artifacts.push({ version: artifact.version, path: archive });
  }
  if (!Array.isArray(plan.instances) || !plan.instances.length)
    throw new Error(
      'The demo plan needs explicit { id, name, version } instances.',
    );
  const ids = new Set();
  const instances = plan.instances.map((instance) => {
    if (
      typeof instance.id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(instance.id) ||
      ids.has(instance.id) ||
      typeof instance.name !== 'string' ||
      !instance.name.trim() ||
      !versions.has(instance.version) ||
      (instance.stopped !== undefined && typeof instance.stopped !== 'boolean')
    )
      throw new Error(
        'Instance ids must be unique and reference a supplied version.',
      );
    ids.add(instance.id);
    return {
      id: instance.id,
      name: instance.name,
      version: instance.version,
      stopped: instance.stopped === true,
    };
  });
  return { artifacts, instances };
}
