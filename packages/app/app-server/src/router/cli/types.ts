/**
 * Command-line hints on API routes, and the command manifest a CLI builds its commands from. The API document is the
 * single source: every documented operation is a command, named from its tag, path and method unless its `x-cli`
 * extension names it, and `x-cli: false` leaves it out.
 */

/** Who calls a command: a person (a session or an API key), or an agent's run (its run token). */
export type CliIdentity = 'person' | 'run';

export const CLI_IDENTITIES: readonly CliIdentity[] = ['person', 'run'];

/**
 * Where a CLI finds an input the command line leaves out: an environment variable by name, such as
 * `GITHUB_REPOSITORY`, or a field of the JSON file an environment variable names, such as `{ file: 'GITHUB_EVENT_PATH',
 * path: 'pull_request.head.sha' }` (dot-separated keys). An unset or empty variable, an unreadable file and a missing
 * field all fall through to the next source.
 */
export type CliEnvDefault =
  string | { readonly file: string; readonly path: string };

/** How one input of a route appears on the command line, keyed by its field name in `CliRouteOptions.flags`. */
export interface CliFlagOptions {
  /** The flag's name when it is not the kebab-case of the field, such as `reply-to` for `parentId`. */
  readonly name?: string;
  /** A one-letter alias, such as `m`. */
  readonly alias?: string;
  /** Also take `--<flag>-file <path>`, whose contents become the value; for long text such as Markdown. */
  readonly contentFile?: boolean;
  /** Ask for a missing value when a terminal is attached. */
  readonly prompt?: boolean;
  /**
   * Also take `--from-env` instead of a value: the CLI reads it from its own environment variable whose name is the
   * value given for this other field (such as `name`), so a secret never sits on the command line.
   */
  readonly fromEnv?: string;
  /**
   * Defaults read from the caller's environment when the flag is not given, the first found wins; a flag given
   * explicitly always wins. For values CI already knows, such as the repository (`['GITHUB_REPOSITORY',
   * 'CI_PROJECT_PATH']`) or the commit being built.
   */
  readonly env?: readonly CliEnvDefault[];
  /** Replaces the schema's description. */
  readonly description?: string;
  /** Not offered on the command line; the field keeps its default. */
  readonly hidden?: boolean;
}

/**
 * Files sent before the request itself: each file named by `--<flag>` is uploaded to the operation `upload` (a
 * `multipart/form-data` route answering `{ data: { id } }`), and the ids it answers fill the body field `field`.
 */
export interface CliUploadOptions {
  /** The operationId of the upload route. */
  readonly upload: string;
  /** The body field the uploaded ids fill. */
  readonly field: string;
  /** The form field the file goes in on the upload route; `file` when left out. */
  readonly part?: string;
  readonly multiple?: boolean;
  readonly description?: string;
  /** Per file. */
  readonly maxBytes?: number;
}

/**
 * One file sent beside the request rather than in it: the route answers an upload ticket (`{ data: { url, method,
 * headers, message? } }`) and the CLI streams the file named by `--<flag>` straight to it, with the ticket's headers
 * only. The upload's answer is the command's result.
 */
export interface CliTicketUploadOptions {
  /** The flag naming the file, such as `file`. */
  readonly flag: string;
  readonly maxBytes: number;
  /** Extensions such as `.tar.gz`; any when left out. */
  readonly accept?: readonly string[];
  readonly description?: string;
  /**
   * The file may be left out, and the route then answers its own result rather than a ticket. To tell the two apart,
   * the CLI sends the file's name in the body field named like the flag when it is given: the route's body declares
   * that field (a string), which the command does not offer as a flag of its own.
   */
  readonly optional?: boolean;
}

/**
 * The files of a directory on the caller's machine that differ from the manifest it holds, sent with the request as
 * `multipart/form-data` parts named `field`, each file named by its path inside the directory. The CLI looks for
 * `dir` at its working directory and each one above it; `manifest` is a JSON array of `{ path, hash }` (SHA-256, hex).
 * The boolean `--<flag>` sends them; without it the request goes as it would without the input.
 */
export interface CliChangedFilesOptions {
  /** The boolean flag, such as `changed`. */
  readonly flag: string;
  /** The form field each file goes in. */
  readonly field: string;
  /** Relative, such as `.nocobase-runner/knowledge`. */
  readonly dir: string;
  /** Inside `dir`, such as `.manifest.json`. */
  readonly manifest: string;
  /** Per file. */
  readonly maxBytes: number;
  readonly maxFiles: number;
  /** Extensions such as `.md`; any when left out. */
  readonly accept?: readonly string[];
  readonly description?: string;
}

/** The `x-cli` extension of an operation. */
export interface CliRouteOptions {
  /** The command's words, such as `issue comment add`; derived from the tag, path and method when left out. */
  readonly command?: string;
  /** The fields given as positional arguments, in order; the path parameters, in path order, when left out. */
  readonly args?: readonly string[];
  /** Per field: how it appears on the command line. */
  readonly flags?: Readonly<Record<string, CliFlagOptions>>;
  /** A flag whose JSON file is the whole request body, such as `file` for `--file issue.json`. */
  readonly bodyFile?: string;
  /** Files uploaded first, by flag name. */
  readonly uploads?: Readonly<Record<string, CliUploadOptions>>;
  /** A file streamed to the upload ticket the route answers. */
  readonly ticketUpload?: CliTicketUploadOptions;
  /** Changed files of a directory, sent with the request. */
  readonly changedFiles?: CliChangedFilesOptions;
  /** The fields a list shows as a table, in order; the first scalar fields when left out. */
  readonly columns?: readonly string[];
  /** Asks before running, with this question, unless `--yes` is given. */
  readonly confirm?: string;
  /** Who may call it; from the operation's security requirements when left out. */
  readonly identities?: readonly CliIdentity[];
  /** Example command lines, without the CLI's name. */
  readonly examples?: readonly string[];
  /** The business action the command performs, such as `pm.issues/comment`; a caller without it is not offered it. */
  readonly action?: string;
  /** Left out of the manifest, while staying documented. */
  readonly hidden?: boolean;
}

/** The operation extension `cliRoute()` produces. */
export const CLI_EXTENSION = 'x-cli';

export interface CliRouteExtension {
  readonly 'x-cli': CliRouteOptions | false;
}

/**
 * The `x-cli` extension for `describeRoute()`: `describeRoute({ tags, summary, operationId, ...cliRoute({ command:
 * 'issue comment add', args: ['issueId'] }) })`. `cliRoute(false)` keeps the route out of the CLI.
 */
export function cliRoute(options: CliRouteOptions | false): CliRouteExtension {
  return { 'x-cli': options };
}

/**
 * Operations an application keeps off its command line while they stay documented (`CliService.exclude()`), such as a
 * library's browser-only flows or the protocol between the application and its own machines.
 */
export interface CliExclusion {
  /** Every operation whose first tag is one of these, such as `Authorization`. */
  readonly tags?: readonly string[];
  /** Every operation whose path starts with one of these, such as `/api/auth/`; the path is below the base path. */
  readonly paths?: readonly string[];
  readonly operationIds?: readonly string[];
}

/** One input of a command, as the manifest describes it. */
export interface CliParameter {
  /** The argument's or flag's name on the command line. */
  readonly name: string;
  /** Its name in the request: the path or query parameter, or the body field. */
  readonly field: string;
  readonly in: 'path' | 'query' | 'body' | 'file';
  /** Its place among the positional arguments; a flag has none. */
  readonly position?: number;
  readonly type:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'string[]'
    | 'number[]'
    | 'json';
  readonly required: boolean;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly default?: unknown;
  readonly alias?: string;
  readonly contentFile?: boolean;
  readonly prompt?: boolean;
  /** `--from-env` fills it from the environment variable named by the value of this field (`CliFlagOptions.fromEnv`). */
  readonly fromEnv?: string;
  /** Read from the caller's environment when not given, the first found wins (`CliFlagOptions.env`). */
  readonly env?: readonly CliEnvDefault[];
  /** For `in: 'file'`: where each file is uploaded first, and which body field its id fills. */
  readonly upload?: {
    readonly method: string;
    readonly path: string;
    readonly part: string;
    readonly field: string;
    readonly multiple: boolean;
    readonly maxBytes?: number;
  };
  /** For `in: 'file'`: the file is streamed to the upload ticket the route answers. */
  readonly ticket?: {
    readonly maxBytes: number;
    readonly accept?: readonly string[];
    /** The file may be left out; when given, its name goes in the body field `field` (`CliTicketUploadOptions.optional`). */
    readonly optional?: boolean;
  };
  /** For `in: 'file'`: the boolean flag sends the changed files of a directory as `field` parts. */
  readonly changed?: {
    readonly dir: string;
    readonly manifest: string;
    readonly maxBytes: number;
    readonly maxFiles: number;
    readonly accept?: readonly string[];
  };
  /** A file part of a `multipart/form-data` body (`in: 'body'`). */
  readonly binary?: boolean;
  readonly multiple?: boolean;
}

export type CliOutputKind = 'data' | 'list' | 'empty' | 'download';

/** One command of the manifest. */
export interface CliCommand {
  /** Its words joined by `:`, such as `issue:comment:add`. */
  readonly id: string;
  readonly summary: string;
  readonly description?: string;
  readonly operationId?: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** The request path below the server's origin, the application's base path included, with `{name}` placeholders. */
  readonly path: string;
  readonly parameters: readonly CliParameter[];
  /** How the body travels; none for a request without one. */
  readonly body?: {
    readonly media: 'application/json' | 'multipart/form-data';
    /** A flag whose JSON file is the whole body. */
    readonly file?: string;
    readonly required?: boolean;
  };
  readonly output: {
    readonly kind: CliOutputKind;
    readonly columns?: readonly string[];
  };
  readonly confirm?: string;
  readonly examples?: readonly string[];
  readonly identities: readonly CliIdentity[];
  readonly action?: string;
}

/** Who a manifest is built for. */
export interface CliCaller {
  readonly kind: CliIdentity;
  /** The person: the caller, or for a run the person who woke the agent. */
  readonly userId: string;
  readonly displayName: string;
  readonly runId?: string;
  /** The business actions the caller holds; a command with an action outside them is left out. None when absent. */
  readonly actions?: ReadonlySet<string>;
}

export interface CliManifestIdentity {
  readonly kind: CliIdentity;
  readonly userId: string;
  readonly displayName: string;
  readonly runId?: string;
  /** The business actions the caller holds, sorted; what decides which commands that name one it is offered. */
  readonly actions: readonly string[];
}

/**
 * A command the API document describes that the caller is not offered, so a CLI can say why instead of "unknown
 * command": it is another identity's (`identity`), or it names an action the caller does not hold (`action`).
 */
export interface CliWithheldCommand {
  readonly id: string;
  readonly summary: string;
  readonly reason: 'identity' | 'action';
  readonly identities: readonly CliIdentity[];
  readonly action?: string;
}

/** What `CliService.describe()` tells about the application's CLI, for the agent-readable reference. */
export interface CliDescription {
  /** The CLI's command name, such as `acme`. */
  readonly bin?: string;
  /** The application's name, such as `Acme`. */
  readonly title?: string;
  /** Lines added to the reference's introduction, such as where the guides are. */
  readonly notes?: readonly string[];
}

/** The `version` of the manifest format. */
export const CLI_MANIFEST_VERSION = 4;

export interface CliManifest {
  readonly version: number;
  /** Changes whenever the commands change; a CLI caches by it. */
  readonly etag: string;
  readonly identity: CliManifestIdentity;
  readonly commands: readonly CliCommand[];
  /** The commands the caller is not offered, and why. */
  readonly withheld: readonly CliWithheldCommand[];
}
