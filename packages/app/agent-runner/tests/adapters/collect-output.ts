import { createRedactor } from '../../src/protocol/index.ts';
import { OutputWriter } from '../../src/agent/output-writer.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

/** Exercise the worker's complete-block compatibility path for existing adapter mapping assertions. */
export async function collectOutput(
  events: AsyncIterable<AdapterEvent>,
): Promise<AdapterEvent[]> {
  const result: AdapterEvent[] = [];
  const writer = new OutputWriter(
    (event) =>
      result.push({
        ...event,
        at: event.at ?? new Date().toISOString(),
      } as AdapterEvent),
    createRedactor(),
    false,
  );
  for await (const event of events) writer.write(event);
  writer.end();
  return result;
}
