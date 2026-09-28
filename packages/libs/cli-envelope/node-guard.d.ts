// The package's own name, so that this resolves to `src` in a checkout and to `dist` once published.
import type { CommandFailureJson } from '@nocobase/cli-envelope';

export const MINIMUM_NODE_MAJOR_VERSION: 24;

export function getNodeMajorVersion(version?: string): number;

export function isSupportedNodeVersion(
  version?: string,
  minimum?: number,
): boolean;

/** The command as typed: the arguments before the first flag, joined. */
export function commandFromArgv(argv: readonly string[]): string;

export function formatUnsupportedNodeVersionMessage(
  name: string,
  version?: string,
  minimum?: number,
): string;

/** The failure document for an unsupported Node.js, with the code `NODE_UNSUPPORTED`. */
export type UnsupportedNodeVersionEnvelope = CommandFailureJson;

export function unsupportedNodeVersionEnvelope(
  command: string,
  version?: string,
  minimum?: number,
): UnsupportedNodeVersionEnvelope;

export interface UnsupportedNodeVersionOutputOptions {
  /** The tool's name, as the message on stderr prefixes it. */
  readonly name: string;
  /** The arguments the tool was run with; `--json` among them selects the document. */
  readonly argv: readonly string[];
  /** What the document's `command` names; `commandFromArgv(argv)` unless the tool has one command to name. */
  readonly command?: string;
  readonly version?: string;
  readonly minimum?: number;
  /** Indentation for the document, for a tool that prints its documents indented; one line by default. */
  readonly indent?: number;
}

export interface UnsupportedNodeVersionOutput {
  readonly stream: 'stdout' | 'stderr';
  readonly text: string;
}

export function unsupportedNodeVersionOutput(
  options: UnsupportedNodeVersionOutputOptions,
): UnsupportedNodeVersionOutput;

export function exitWhenFlushed(code: number): Promise<void>;
