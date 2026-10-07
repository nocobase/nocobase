// Running a request command of the manifest (`kind: 'rest'`). The line is read by the shared parser
// (`../parse/arguments.ts`, also `@nocobase/app-cli-client/parse`), over this machine: files relative to the working
// directory, this process's environment, and a prompt for a missing value when there is a terminal to ask in. Each
// upload parameter's files are then uploaded to their route first and the ids they answer fill the body field; a ticket
// parameter's file is streamed to the upload ticket the request answers; a changed-files parameter sends its
// directory's changed files as multipart parts; a binary body field is a part of its own; a `download` command saves
// to `--out`; a command that asks first takes `--yes`.
import { openAsBlob } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import { appCliConfig } from '../config.ts';
import { UsageError } from '../lib/command.ts';
import { CliCommandError } from '../lib/envelope.ts';
import { globalFlags } from '../lib/globals.ts';
import { AppApiError } from '../lib/http.ts';
import { mediaTypeOf } from '../lib/mime.ts';
import {
  CliParseError,
  parameterLabel,
  parseCommandLine,
  type CliCall,
  type CliParseIo,
} from '../parse/arguments.ts';
import { fillRequest, requestText } from '../request.ts';
import { download, send } from './execute.ts';
import { changedFiles, type LocalFile } from './files.ts';
import type { CliCommand, CliParameter } from './manifest.ts';
import { urlFor, type Session } from './session.ts';
import { streamToTicket } from './ticket.ts';

/** What a command answered: the API's `{ data, meta? }`. */
export interface ApiAnswer {
  readonly data: unknown;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export type LocalUpload = LocalFile;

/** A line read on this machine: its files found, and `--out` resolved against the working directory. */
export type RestCall = CliCall<LocalUpload>;

async function ask(question: string): Promise<string> {
  const lines = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    return await lines.question(question);
  } finally {
    lines.close();
  }
}

const interactive = () =>
  Boolean(process.stdin.isTTY) && Boolean(process.stderr.isTTY);

async function askFor(parameter: CliParameter): Promise<string> {
  const choices = parameter.enum ? ` (${parameter.enum.join(', ')})` : '';
  const what = parameter.description
    ? `${parameterLabel(parameter)}, ${parameter.description.replace(/\.$/u, '')}`
    : parameterLabel(parameter);
  for (;;) {
    const answer = (await ask(`${what}${choices}: `)).trim();
    if (answer !== '') return answer;
  }
}

/** This machine, as the parser reads it: files relative to `cwd`, this process's environment, and its terminal. */
export function localIo(cwd: string): CliParseIo<LocalUpload> {
  return {
    readText: (file) =>
      readFile(path.resolve(cwd, file), 'utf8').catch(() => undefined),
    env: (name) => process.env[name],
    file: async (file) => {
      const full = path.resolve(cwd, file);
      const info = await stat(full).catch(() => undefined);
      return info?.isFile()
        ? { path: full, name: path.basename(full), size: info.size }
        : undefined;
    },
    changed: (spec, flag) => changedFiles(spec, flag, cwd),
    ...(interactive() ? { ask: askFor } : {}),
  };
}

/** Reads the rest of the line against the command's parameters; files are read relative to `cwd`. */
export async function parseRestCall(
  command: CliCommand,
  rest: readonly string[],
  cwd: string = process.cwd(),
): Promise<RestCall> {
  let call: RestCall;
  try {
    call = await parseCommandLine(command, rest, {
      bin: appCliConfig().bin,
      io: localIo(cwd),
      yes: globalFlags().yes,
      dryRun: globalFlags().dryRun,
    });
  } catch (error) {
    // A plain usage error stays one, so it reads as before: its message, with no suggestions.
    if (error instanceof CliParseError)
      throw error.code === 'INVALID_USAGE' && error.suggestions.length === 0
        ? new UsageError(error.message, error.exit)
        : new CliCommandError(error.code, error.message, {
            exit: error.exit,
            suggestions: error.suggestions,
            details: error.details,
          });
    throw error;
  }
  return call.out === undefined
    ? call
    : { ...call, out: path.resolve(cwd, call.out) };
}

export interface RestOptions {
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}

/** Uploads each file of the call's upload parameters; the ids, by parameter. */
async function uploadAll(
  session: Session,
  call: RestCall,
  options: RestOptions,
  uploaded: { readonly path: string; readonly id: string }[],
): Promise<Map<CliParameter, string[]>> {
  const ids = new Map<CliParameter, string[]>();
  for (const [parameter, files] of call.uploads) {
    const upload = parameter.upload;
    if (!upload) continue;
    const list: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.append(
        upload.part,
        new File([await openAsBlob(file.path)], file.name, {
          type: mediaTypeOf(file.name),
        }),
      );
      const answer = await send(
        urlFor(session.server, upload.path),
        {
          method: upload.method,
          headers: { accept: 'application/json', ...session.headers },
          body: form,
        },
        { ...options, timeoutMs: options.timeoutMs ?? 30 * 60_000 },
      );
      const id = (answer as { data?: { id?: unknown } } | undefined)?.data?.id;
      if (typeof id !== 'string')
        throw new AppApiError(
          0,
          'UPLOAD_FAILED',
          `${upload.path} answered no id for ${file.name}.`,
        );
      uploaded.push({ path: upload.path, id });
      list.push(id);
    }
    ids.set(parameter, list);
  }
  return ids;
}

/** Removes what was uploaded for a request that then failed; a removal that fails leaves the upload to expire. */
async function discard(
  session: Session,
  uploaded: readonly { readonly path: string; readonly id: string }[],
  options: RestOptions,
): Promise<void> {
  for (const { path: uploadPath, id } of uploaded)
    await send(
      urlFor(
        session.server,
        `${uploadPath.replace(/\/+$/u, '')}/${encodeURIComponent(id)}`,
      ),
      { method: 'DELETE', headers: session.headers },
      options,
    ).catch(() => undefined);
}

/** The request a call makes: its URL, and its body. */
export async function buildRequest(
  session: Session,
  command: CliCommand,
  call: RestCall,
  uploadedIds: ReadonlyMap<CliParameter, readonly string[]> = new Map(),
): Promise<{ url: URL; body?: string | FormData; type?: string }> {
  const filled = fillRequest(command, call.values, call.bodyFile);
  const fields = filled.fields;
  for (const [parameter, ids] of uploadedIds)
    fields[parameter.field] = parameter.upload?.multiple ? ids : ids[0];
  // An optional ticket file says it is coming: the route answers a ticket rather than its own result.
  const ticketParameter = command.parameters.find(
    (parameter) => parameter.ticket?.optional,
  );
  if (ticketParameter && call.ticket)
    fields[ticketParameter.field] = call.ticket.name;
  const url = urlFor(session.server, filled.path);
  if (!command.body && !call.changed) return { url };
  // Changed files go as parts beside the fields; without files a JSON body keeps line breaks as they are.
  if (call.changed) fields[call.changed.field] = [...call.changed.files];
  if (call.changed || command.body?.media === 'multipart/form-data') {
    const form = new FormData();
    for (const [field, value] of Object.entries(fields)) {
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        if (item === undefined || item === null) continue;
        if (item && typeof item === 'object' && 'path' in item) {
          const local = item as LocalUpload;
          form.append(
            field,
            new File([await openAsBlob(local.path)], local.name, {
              type: mediaTypeOf(local.name),
            }),
          );
        } else form.append(field, requestText(item));
      }
    }
    return { url, body: form };
  }
  return { url, body: JSON.stringify(fields), type: 'application/json' };
}

/** Sends the call; the API's answer, or for a download the saved file. */
export async function executeRest(
  session: Session,
  command: CliCommand,
  call: RestCall,
  options: RestOptions = {},
): Promise<ApiAnswer> {
  if (command.confirm && !call.yes && !globalFlags().yes) {
    if (!interactive())
      throw new CliCommandError(
        'CONFIRMATION_REQUIRED',
        `${command.confirm} Nothing was done without a terminal to ask in.`,
        {
          exit: EXIT_CODES.validation,
          suggestions: [{ message: 'Pass --yes to go ahead without asking.' }],
        },
      );
    const answer = (await ask(`${command.confirm} [y/N] `)).trim();
    if (!/^y(es)?$/iu.test(answer))
      throw new UsageError('Not done.', EXIT_CODES.general);
  }
  const uploaded: { path: string; id: string }[] = [];
  try {
    const ids = await uploadAll(session, call, options, uploaded);
    const { url, body, type } = await buildRequest(session, command, call, ids);
    const init: RequestInit = {
      method: command.method,
      headers: {
        accept: command.output.kind === 'download' ? '*/*' : 'application/json',
        ...(type ? { 'content-type': type } : {}),
        ...session.headers,
      },
      ...(body === undefined ? {} : { body }),
    };
    if (command.output.kind === 'download') {
      const saved = await download(url, init, call.out, options);
      return {
        data: saved.data,
        ...(saved.message ? { meta: { message: saved.message } } : {}),
      };
    }
    const answer = (await send(url, init, options)) as
      { data?: unknown; meta?: Record<string, unknown> } | undefined;
    if (call.ticket) {
      const uploaded = await streamToTicket(
        session,
        answer?.data,
        call.ticket,
        options,
      );
      return {
        data: uploaded.data,
        ...(uploaded.message ? { meta: { message: uploaded.message } } : {}),
      };
    }
    return {
      data: answer?.data ?? null,
      ...(answer?.meta ? { meta: answer.meta } : {}),
    };
  } catch (error) {
    await discard(session, uploaded, options);
    throw error;
  }
}
