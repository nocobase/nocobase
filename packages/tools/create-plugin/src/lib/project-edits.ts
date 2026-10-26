import {
  chmod,
  copyFile,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { ProjectError, type ProjectEdit } from './project.ts';

async function checkUnchanged(edit: ProjectEdit): Promise<void> {
  const current = await readFile(edit.path, 'utf8').catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    },
  );
  if (current !== edit.before)
    throw new ProjectError(
      'PROJECT_CHANGED',
      `${edit.path} changed during generation. Run create-plugin again.`,
    );
}

/** Stage replacements and backups before changing any application configuration. */
export async function applyProjectEdits(
  edits: readonly ProjectEdit[],
): Promise<void> {
  const prepared: {
    edit: ProjectEdit;
    target: string;
    directory: string;
    committed: boolean;
    keepBackup: boolean;
  }[] = [];
  try {
    for (const edit of edits) {
      await checkUnchanged(edit);
      // Replace a symlink's target while preserving the application's symlink.
      const target =
        edit.before === undefined ? edit.path : await realpath(edit.path);
      const directory = await mkdtemp(
        path.join(path.dirname(target), '.create-plugin-'),
      );
      prepared.push({
        edit,
        target,
        directory,
        committed: false,
        keepBackup: false,
      });
      if (edit.before !== undefined) {
        await copyFile(target, path.join(directory, 'before'));
      }
      const replacement = path.join(directory, 'after');
      await writeFile(replacement, edit.after, { flag: 'wx' });
      if (edit.before !== undefined) {
        await chmod(replacement, (await stat(target)).mode);
      }
    }
    for (const item of prepared) {
      await checkUnchanged(item.edit);
      await rename(path.join(item.directory, 'after'), item.target);
      item.committed = true;
    }
  } catch (error) {
    const failures: Error[] = [];
    for (const item of [...prepared].reverse()) {
      if (!item.committed) continue;
      try {
        if (item.edit.before === undefined) await rm(item.target);
        else await rename(path.join(item.directory, 'before'), item.target);
      } catch (rollbackError) {
        item.keepBackup = true;
        failures.push(
          new Error(
            `Could not restore ${item.target}; recovery files remain in ${item.directory}.`,
            { cause: rollbackError },
          ),
        );
      }
    }
    if (failures.length)
      throw new AggregateError(
        [error, ...failures],
        `Application configuration rollback failed. ${failures.map((failure) => failure.message).join(' ')}`,
        { cause: error },
      );
    throw error;
  } finally {
    for (const item of prepared) {
      if (!item.keepBackup)
        await rm(item.directory, { recursive: true, force: true });
    }
  }
}
