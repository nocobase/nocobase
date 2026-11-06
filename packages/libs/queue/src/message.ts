import {
  assertJobId,
  resolvePublishOptions,
  type QueueJobDefaults,
  type ResolvedJobOptions,
} from './options.js';
import type { Channel, PublishEntry, PublishOptions } from './types.js';

/** A job ready to be written: every check and every ID is already done. */
export interface PreparedJob {
  /** `undefined` lets the backend assign its default ID. */
  readonly jobId: string | undefined;
  readonly channel: Channel;
  /** The message as JSON text, serialized once. */
  readonly text: string;
  readonly options: ResolvedJobOptions;
}

export function assertChannel(value: unknown): asserts value is Channel {
  if (typeof value !== 'string' || value === '') {
    throw new TypeError('A queue channel must be a non-empty string.');
  }
}

/**
 * Serializes with BullMQ's JSON rule: a top-level `undefined` becomes `{}`,
 * cycles and BigInt throw, and a root that produces no JSON text is rejected.
 */
export function serializeMessage(message: unknown): string {
  if (message === undefined) return '{}';
  const text = JSON.stringify(message) as string | undefined;
  if (text === undefined) {
    throw new TypeError('A queue message must serialize to JSON.');
  }
  return text;
}

export function parseMessage(text: string): unknown {
  return JSON.parse(text) as unknown;
}

/**
 * Prepares every entry before anything is written, so a failure in any of
 * them — serialization, options or ID generation — writes nothing.
 */
export function prepareJobs(
  queue: string,
  entries: readonly PublishEntry[],
  defaults: QueueJobDefaults,
  options: PublishOptions | undefined,
): PreparedJob[] {
  if (!Array.isArray(entries)) {
    throw new TypeError(
      'publishMany expects an array of { channel, message }.',
    );
  }
  const resolved = resolvePublishOptions(defaults, options);
  return entries.map((entry: PublishEntry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new TypeError('Each published entry must be { channel, message }.');
    }
    assertChannel(entry.channel);
    const text = serializeMessage(entry.message);
    let jobId: string | undefined;
    if (resolved.jobIdProducer) {
      jobId = resolved.jobIdProducer(queue, entry.channel, entry.message);
      assertJobId(jobId);
    }
    return {
      jobId,
      channel: entry.channel,
      text,
      options: resolved.job,
    };
  });
}
