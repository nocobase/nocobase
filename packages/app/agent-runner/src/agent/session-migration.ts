// Copy only the assigned conversation into a private container. Never read/copy authentication or other sessions.
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  copyFile,
  cp,
  lstat,
  link,
  unlink,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import type { AdapterSession } from './adapters/types.ts';

export async function claudeProjectKey(dir: string): Promise<string> {
  const cwd = await realpath(dir).catch(() => path.resolve(dir));
  let key = cwd.replace(/[^a-zA-Z0-9]/g, '-');
  if (key.length > 200) {
    let hash = 0;
    for (let i = 0; i < cwd.length; i++)
      hash = ((hash << 5) - hash + cwd.charCodeAt(i)) | 0;
    key = `${key.slice(0, 200)}-${Math.abs(hash).toString(36)}`;
  }
  return key;
}

async function regular(file: string): Promise<boolean> {
  try {
    return (await lstat(file)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function migrateClaudeConversation(
  session: AdapterSession,
): Promise<void> {
  const id = session.resumeSessionId;
  if (id === undefined || !/^[a-zA-Z0-9_-]+$/u.test(id)) return;
  const config = (
    session.env.CLAUDE_CONFIG_DIR ||
    path.join(session.env.HOME ?? homedir(), '.claude')
  ).normalize('NFC');
  const target = path.join(
    config,
    'projects',
    await claudeProjectKey(session.workDir),
  );
  if (await regular(path.join(target, `${id}.jsonl`))) return;
  for (const cwd of session.legacyWorkDirs ??
    session.additionalDirectories ??
    []) {
    const source = path.join(config, 'projects', await claudeProjectKey(cwd));
    const file = path.join(source, `${id}.jsonl`);
    if (!(await regular(file))) continue;
    await mkdir(target, { recursive: true, mode: 0o700 });
    const companion = path.join(source, id);
    if ((await lstat(companion).catch(() => undefined))?.isDirectory())
      await cp(companion, path.join(target, id), {
        recursive: true,
        force: false,
        dereference: false,
      });
    // Publish the root transcript last, so interrupted companion copying cannot appear as a finished migration.
    await copyFile(
      file,
      path.join(target, `${id}.jsonl`),
      constants.COPYFILE_EXCL,
    ).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    });
    return;
  }
}

/** Pi's exact-id lookup filters custom session directories by the header cwd. Preserve the transcript and id. */
export async function migratePiConversation(
  session: AdapterSession,
): Promise<void> {
  const id = session.resumeSessionId;
  if (
    session.sessionStoreDir === undefined ||
    id === undefined ||
    !/^[a-zA-Z0-9_-]+$/u.test(id)
  )
    return;
  const base =
    session.env.PI_CODING_AGENT_DIR ??
    path.join(session.env.HOME ?? homedir(), '.pi', 'agent');
  const dirs = [...(session.legacyWorkDirs ?? []), session.workDir].map((cwd) =>
    path.join(
      base,
      'sessions',
      `--${path
        .resolve(cwd)
        .replace(/^[/\\]/u, '')
        .replace(/[/\\:]/g, '-')}--`,
    ),
  );
  if (session.env.PI_CODING_AGENT_SESSION_DIR !== undefined)
    dirs.push(session.env.PI_CODING_AGENT_SESSION_DIR);
  for (const dir of [...new Set(dirs)]) {
    for (const file of await readdir(dir).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return [] as string[];
      throw error;
    })) {
      if (
        !file.endsWith(`_${id}.jsonl`) ||
        !(await regular(path.join(dir, file)))
      )
        continue;
      const text = await readFile(path.join(dir, file), 'utf8');
      const newline = text.indexOf('\n');
      if (newline < 0)
        throw new Error('Pi migration requires a complete session header');
      const header = JSON.parse(text.slice(0, newline)) as {
        type?: string;
        id?: string;
        cwd?: string;
      };
      if (header.type !== 'session' || header.id !== id)
        throw new Error('Pi migration session identity mismatch');
      await mkdir(session.sessionStoreDir, { recursive: true, mode: 0o700 });
      const destination = path.join(session.sessionStoreDir, file);
      const migrated = `${JSON.stringify({ ...header, cwd: session.workDir })}${text.slice(newline)}`;
      const validate = (actual: string) => {
        // A complete source prefix proves migration; subsequent tool messages must remain untouched.
        if (!actual.startsWith(migrated) || !actual.endsWith('\n'))
          throw new Error(
            'Pi migration target is incomplete or divergent; source and target retained',
          );
        for (const line of actual.trimEnd().split('\n')) JSON.parse(line);
      };
      validate(migrated);
      const temporary = `${destination}.${randomUUID()}.migration`;
      try {
        await writeFile(temporary, migrated, { flag: 'wx', mode: 0o600 });
        validate(await readFile(temporary, 'utf8'));
        // Exclusive atomic publication also handles concurrent migrations without replacing continued history.
        await link(temporary, destination).catch((error) => {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        });
        validate(await readFile(destination, 'utf8'));
      } finally {
        await unlink(temporary).catch((error) => {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        });
      }
      return;
    }
  }
}
