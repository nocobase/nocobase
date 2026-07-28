import {
  createParser,
  type EventSourceMessage,
  type ParseError,
} from "eventsource-parser";

export type NocoBaseStreamEvent = {
  type: string;
  body?: unknown;
  sessionId?: string;
  from?: string;
  username?: string;
  errorName?: string;
};

const MAX_SSE_BUFFER_SIZE = 16 * 1024 * 1024;

export async function* parseNocoBaseSSE(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<NocoBaseStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events: EventSourceMessage[] = [];
  let parseError: ParseError | undefined;
  const parser = createParser({
    maxBufferSize: MAX_SSE_BUFFER_SIZE,
    onEvent: (event) => events.push(event),
    onError: (error) => {
      parseError = error;
    },
  });

  const drainEvents = function* () {
    while (events.length) {
      const event = events.shift();
      if (!event) continue;
      const payload = event.data.trim();
      if (!payload || payload === "[DONE]") continue;
      yield JSON.parse(payload) as NocoBaseStreamEvent;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) parser.feed(decoder.decode(value, { stream: true }));
      if (parseError) throw parseError;
      yield* drainEvents();
      if (!done) continue;

      const remainder = decoder.decode();
      if (remainder) parser.feed(remainder);
      parser.reset({ consume: true });
      if (parseError) throw parseError;
      yield* drainEvents();
      return;
    }
  } finally {
    reader.releaseLock();
  }
}
