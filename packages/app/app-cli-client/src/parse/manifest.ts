// The command manifest as a CLI reads it (`GET /api/cli/manifest`): the commands the application's API document describes
// for the caller, each a request to one of its routes. Types only, so the parser beside it runs anywhere.

/**
 * Where an input left off the line is read from: an environment variable, or a field (dot-separated `path`) of the
 * JSON file the variable `file` names.
 */
export type CliEnvDefault =
  string | { readonly file: string; readonly path: string };

/** One input of a command: an argument or a flag, and where it goes in the request. */
export interface CliParameter {
  readonly name: string;
  readonly field: string;
  readonly in: 'path' | 'query' | 'body' | 'file';
  readonly position?: number | undefined;
  readonly type:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'string[]'
    | 'number[]'
    | 'json';
  readonly required: boolean;
  readonly description?: string | undefined;
  readonly enum?: readonly string[] | undefined;
  readonly default?: unknown;
  readonly alias?: string | undefined;
  readonly contentFile?: boolean | undefined;
  readonly prompt?: boolean | undefined;
  /** `--from-env` fills it from the environment variable named by the value of this field. */
  readonly fromEnv?: string | undefined;
  /** Read from the environment when not given, the first found wins; a value given on the line always wins. */
  readonly env?: readonly CliEnvDefault[] | undefined;
  readonly upload?:
    | {
        readonly method: string;
        readonly path: string;
        readonly part: string;
        readonly field: string;
        readonly multiple: boolean;
        readonly maxBytes?: number | undefined;
      }
    | undefined;
  readonly ticket?:
    | {
        readonly maxBytes: number;
        readonly accept?: readonly string[] | undefined;
        /** The file may be left out; when given, its name goes in the body field `field`. */
        readonly optional?: boolean | undefined;
      }
    | undefined;
  readonly changed?:
    | {
        readonly dir: string;
        readonly manifest: string;
        readonly maxBytes: number;
        readonly maxFiles: number;
        readonly accept?: readonly string[] | undefined;
      }
    | undefined;
  readonly binary?: boolean | undefined;
  readonly multiple?: boolean | undefined;
}

/** One command: a request to one API route. */
export interface CliCommand {
  readonly id: string;
  readonly summary: string;
  readonly description?: string | undefined;
  readonly operationId?: string | undefined;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly parameters: readonly CliParameter[];
  readonly body?:
    | {
        readonly media: 'application/json' | 'multipart/form-data';
        readonly file?: string | undefined;
        readonly required?: boolean | undefined;
      }
    | undefined;
  readonly output: {
    readonly kind: 'data' | 'list' | 'empty' | 'download';
    readonly columns?: readonly string[] | undefined;
  };
  readonly confirm?: string | undefined;
  readonly examples?: readonly string[] | undefined;
  readonly identities: readonly ('person' | 'run')[];
  readonly action?: string | undefined;
}

/** A command the caller is not offered, and why. */
export interface CliWithheldCommand {
  readonly id: string;
  readonly summary: string;
  readonly reason: 'identity' | 'action';
  readonly identities: readonly ('person' | 'run')[];
  readonly action?: string | undefined;
}

export interface CliManifest {
  readonly version: number;
  readonly etag: string;
  readonly identity: {
    readonly kind: 'person' | 'run';
    readonly userId: string;
    readonly displayName: string;
    readonly runId?: string | undefined;
    /** Absent from a server older than manifest version 4. */
    readonly actions?: readonly string[] | undefined;
  };
  readonly commands: readonly CliCommand[];
  /** Absent from a server older than manifest version 4. */
  readonly withheld?: readonly CliWithheldCommand[] | undefined;
}
