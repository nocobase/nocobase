// The `build` job: check out a commit in a worktree of its own, run the command an administrator configured, and
// stream each output file to the URL the job names with exactly the headers it names.
//
//   <work root>/.jobs/<app>/<jobId>/src    the worktree, detached at the commit (from the shared bare cache)
//   <work root>/.jobs/<app>/<jobId>/home   the command's HOME: links to package-manager caches only
//   <work root>/.jobs/<app>/<jobId>/tmp    its TMPDIR
//
// The directory goes when the job ends, whatever the outcome. The command gets only the job's variables and a minimal
// environment (jobs/env.ts); the runner's key, its registrations and the host's git credentials stay out of reach of
// what it is handed. Outputs must be regular files inside the checkout (symbolic links are resolved and refused when
// they point outside), no larger than `maxBytes`.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import type {
  BuildJobResult,
  BuildJobSpec,
  BuildOutput,
} from '../../protocol/index.ts';
import { isInside } from '../command-policy.ts';
import { buildJobEnv, prepareJobHome } from './env.ts';
import {
  addJobWorktree,
  fetchRepo,
  removeJobWorktree,
  targetCommit,
} from './git.ts';
import { NO_ISOLATION } from '../isolation.ts';
import { runCommand } from './process.ts';
import { JobFailure, type JobContext } from './types.ts';

/** The job directories of one application. */
export function jobsRoot(workRoot: string): string {
  return path.join(workRoot, '.jobs');
}

async function sha256Of(file: string, signal: AbortSignal): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file, { signal }))
    hash.update(chunk as Buffer);
  return hash.digest('hex');
}

/** The URL an output goes to: as given, or a path on the application. */
export function uploadUrl(server: string, url: string): URL {
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(url)) return new URL(url);
  return new URL(
    url.replace(/^\//u, ''),
    server.endsWith('/') ? server : `${server}/`,
  );
}

async function readAnswer(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (text === '') return undefined;
  if ((response.headers.get('content-type') ?? '').includes('json'))
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // Not JSON after all.
    }
  return text.slice(0, 10_000);
}

async function upload(
  context: JobContext,
  output: BuildOutput,
  file: string,
  size: number,
): Promise<{ status: number; body?: unknown }> {
  const url = uploadUrl(context.server, output.upload.url);
  let response: Response;
  try {
    response = await (context.fetch ?? fetch)(url, {
      method: output.upload.method,
      headers: {
        ...output.upload.headers,
        'content-type': output.upload.contentType ?? 'application/octet-stream',
        'content-length': String(size),
      },
      body: Readable.toWeb(createReadStream(file)),
      duplex: 'half',
      signal: context.signal,
    });
  } catch (error) {
    if (context.signal.aborted) throw error;
    throw new JobFailure(
      'uploadFailed',
      `Could not upload ${output.path} to ${url.origin}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const body = await readAnswer(response);
  if (!response.ok)
    throw new JobFailure(
      'uploadFailed',
      `Uploading ${output.path} answered ${response.status}${body === undefined ? '' : `: ${typeof body === 'string' ? body.slice(0, 2000) : JSON.stringify(body).slice(0, 2000)}`}`,
    );
  return { status: response.status, ...(body === undefined ? {} : { body }) };
}

export async function runBuild(
  context: JobContext,
  spec: BuildJobSpec,
): Promise<BuildJobResult> {
  const started = Date.now();
  const src = path.join(context.jobDir, 'src');
  const home = path.join(context.jobDir, 'home');
  const tmp = path.join(context.jobDir, 'tmp');
  let cache: string | undefined;
  try {
    context.phase('checkout');
    context.log('runner', `fetch ${spec.repo.url}`);
    cache = await fetchRepo(
      context.paths,
      {
        url: spec.repo.url,
        ...(spec.repo.auth ? { auth: spec.repo.auth } : {}),
      },
      spec.repo.sha ? [spec.repo.sha] : [],
    );
    const sha = await targetCommit(cache, spec.repo);
    await addJobWorktree(cache, src, sha);
    context.log('runner', `checked out ${sha}`);
    if (context.signal.aborted) throw context.signal.reason;

    const cwd = path.resolve(src, spec.workdir ?? '.');
    const cwdInfo = await stat(cwd).catch(() => undefined);
    if (cwdInfo?.isDirectory() !== true || !isInside(src, cwd))
      throw new JobFailure(
        'jobUnsupported',
        `The checkout has no directory ${spec.workdir ?? '.'}.`,
        { sha },
      );
    await prepareJobHome(home);
    await mkdir(tmp, { recursive: true, mode: 0o700 });

    context.phase('command');
    const [command, ...args] =
      'argv' in spec.command
        ? spec.command.argv
        : ['/bin/sh', '-c', spec.command.shell];
    context.log(
      'runner',
      'argv' in spec.command
        ? `$ ${spec.command.argv.join(' ')}`
        : `$ sh -c ${JSON.stringify(spec.command.shell)}`,
    );
    let outcome;
    try {
      const started = (context.isolation ?? NO_ISOLATION).wrap(
        command,
        args,
        buildJobEnv({
          source: process.env,
          env: spec.env,
          home,
          tmpDir: tmp,
        }),
      );
      outcome = await runCommand({
        command: started.command,
        args: started.args,
        cwd,
        env: started.env,
        ...(started.stdin !== undefined ? { stdin: started.stdin } : {}),
        signal: context.signal,
        log: (stream, text, partial) => context.log(stream, text, partial),
        onGroup: (pgid) => void context.setCommandGroup(pgid),
      });
    } catch (error) {
      throw new JobFailure(
        'commandFailed',
        `Could not start ${command}: ${error instanceof Error ? error.message : String(error)}`,
        { sha },
      );
    }
    if (outcome.aborted || context.signal.aborted) throw context.signal.reason;
    if (outcome.exitCode !== 0)
      throw new JobFailure(
        'commandFailed',
        `The command ${outcome.exitCode === null ? `was killed by ${outcome.signal ?? 'a signal'}` : `exited with ${outcome.exitCode}`}${outcome.stderrTail ? `:\n${outcome.stderrTail.slice(-2000)}` : '.'}`,
        {
          sha,
          ...(outcome.exitCode === null ? {} : { exitCode: outcome.exitCode }),
        },
      );

    const outputs: BuildJobResult['outputs'][number][] = [];
    for (const output of spec.outputs) {
      context.phase('upload');
      const file = path.resolve(cwd, output.path);
      const real = await realpath(file).catch(() => undefined);
      const info = real === undefined ? undefined : await stat(real);
      if (
        real === undefined ||
        info?.isFile() !== true ||
        !isInside(await realpath(src), real)
      )
        throw new JobFailure(
          'outputMissing',
          `The command did not produce ${output.path} inside the checkout.`,
          { sha, exitCode: 0 },
        );
      if (output.maxBytes !== undefined && info.size > output.maxBytes)
        throw new JobFailure(
          'outputMissing',
          `${output.path} is ${info.size} bytes, more than the ${output.maxBytes} allowed.`,
          { sha, exitCode: 0 },
        );
      const sha256 = await sha256Of(real, context.signal);
      context.log(
        'runner',
        `upload ${output.path} (${info.size} bytes, sha256 ${sha256}) to ${uploadUrl(context.server, output.upload.url).origin}`,
      );
      const answer = await upload(context, output, real, info.size).catch(
        (error: unknown) => {
          if (error instanceof JobFailure)
            throw new JobFailure(error.reason, error.message, {
              sha,
              exitCode: 0,
            });
          throw error;
        },
      );
      outputs.push({
        path: output.path,
        sha256,
        size: info.size,
        upload: answer,
      });
    }
    return {
      kind: 'build',
      sha,
      exitCode: 0,
      durationMs: Date.now() - started,
      outputs,
    };
  } finally {
    await removeJobWorktree(cache, src);
  }
}
