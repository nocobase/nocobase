import { RealtimeProtocolError, validateRealtimeTopic } from '../protocol.js';
import type { RealtimeTopicOptions } from './types.js';

export interface TopicDefinition {
  readonly pattern: string;
  readonly segments: readonly string[];
  readonly parameters: ReadonlyMap<number, string>;
  readonly options: RealtimeTopicOptions;
}

export function compileTopic(
  pattern: string,
  options: RealtimeTopicOptions,
  family: boolean,
): TopicDefinition {
  const segments = pattern.split(':');
  const parameters = new Map<number, string>();
  const names = new Set<string>();
  for (const [index, segment] of segments.entries()) {
    const match = family ? /^\{([a-zA-Z][a-zA-Z0-9]*)\}$/.exec(segment) : null;
    if (!match) continue;
    if (index === 0 || names.has(match[1])) {
      throw new RealtimeProtocolError(
        'INVALID_TOPIC',
        'Topic parameters must be unique and follow a namespace.',
      );
    }
    names.add(match[1]);
    parameters.set(index, match[1]);
  }
  validateRealtimeTopic(
    segments
      .map((segment, index) => (parameters.has(index) ? 'value' : segment))
      .join(':'),
  );
  if (family && parameters.size === 0) {
    throw new RealtimeProtocolError(
      'INVALID_TOPIC',
      'A topic family requires a parameter.',
    );
  }
  return {
    pattern,
    segments,
    parameters,
    options: Object.freeze({ ...options }),
  };
}

export function topicsOverlap(
  first: TopicDefinition,
  second: TopicDefinition,
): boolean {
  return (
    first.segments.length === second.segments.length &&
    first.segments.every(
      (segment, index) =>
        first.parameters.has(index) ||
        second.parameters.has(index) ||
        segment === second.segments[index],
    )
  );
}

export function matchTopic(
  definition: TopicDefinition,
  topic: string,
): Readonly<Record<string, string>> | undefined {
  const segments = topic.split(':');
  if (segments.length !== definition.segments.length) return undefined;
  const params: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (const [index, segment] of segments.entries()) {
    const parameter = definition.parameters.get(index);
    if (parameter) {
      if (!segment) return undefined;
      params[parameter] = segment;
    } else if (definition.segments[index] !== segment) return undefined;
  }
  return Object.freeze(params);
}

export function formatTopic(
  definition: TopicDefinition,
  params: Readonly<Record<string, string>>,
): string {
  const topic = definition.segments
    .map((segment, index) => {
      const parameter = definition.parameters.get(index);
      if (!parameter) return segment;
      const value = params[parameter];
      if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) {
        throw new RealtimeProtocolError(
          'INVALID_TOPIC',
          `Invalid topic parameter "${parameter}".`,
        );
      }
      return value;
    })
    .join(':');
  validateRealtimeTopic(topic);
  return topic;
}
