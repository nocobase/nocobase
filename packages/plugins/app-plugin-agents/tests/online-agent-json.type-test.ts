import { expectTypeOf } from 'vitest';
import { z } from 'zod';
import {
  OnlineAgentConfigurer,
  type OnlineAgentToolContext,
  type OnlineAgentToolDefinition,
} from '../server/online-agent/config.js';
import type { OnlineAgentJson } from '../server/online-agent/codec.js';

// Compile-only checks: this file is included by tsconfig.type-tests.json, not Vitest.
function checkContract(configurer: OnlineAgentConfigurer): void {
  configurer.registerTool('inferred_json', {
    version: '1',
    definition: {
      inputSchema: z.object({ id: z.string() }),
      execute: (input, options) => {
        expectTypeOf(input).toEqualTypeOf<{ id: string }>();
        expectTypeOf(options.context).toEqualTypeOf<OnlineAgentToolContext>();
        return { id: input.id, count: 1 };
      },
      toModelOutput: ({ output }) => {
        expectTypeOf(output).toEqualTypeOf<{ id: string; count: number }>();
        return { type: 'json', value: output };
      },
      public: {
        input: (input) => {
          expectTypeOf(input).toEqualTypeOf<{ id: string }>();
          return input;
        },
        output: (output) => {
          expectTypeOf(output).toEqualTypeOf<{ id: string; count: number }>();
          return output;
        },
      },
    },
  });
  configurer.registerTool('promised_json', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      execute: async () => ({ value: [null, true, 1, 'text'] }),
    },
  });
  configurer.registerTool('streamed_json', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      execute: async function* () {
        yield { count: 1 };
        yield { count: 2 };
      },
    },
  });
  configurer.registerTool('date', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Dates must be converted explicitly inside execute.
      execute: () => new Date(0),
    },
  });
  configurer.registerTool('bigint', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error BigInt is not a JSON tool result.
      execute: () => 1n,
    },
  });
  configurer.registerTool('binary', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Binary is not a JSON tool result.
      execute: () => new Uint8Array([1]),
    },
  });
  configurer.registerTool('promised_date', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Resolving a Promise does not make Date JSON-safe.
      execute: async () => new Date(0),
    },
  });
  configurer.registerTool('promised_bigint', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Promised BigInt remains invalid.
      execute: async () => 1n,
    },
  });
  configurer.registerTool('promised_binary', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Promised binary remains invalid.
      execute: async () => new Uint8Array([1]),
    },
  });
  configurer.registerTool('streamed_date', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Every streamed output must satisfy the JSON contract.
      execute: async function* () {
        yield new Date(0);
      },
    },
  });
  configurer.registerTool('streamed_bigint', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error BigInt emissions are not JSON values.
      execute: async function* () {
        yield 1n;
      },
    },
  });
  configurer.registerTool('streamed_binary', {
    version: '1',
    definition: {
      inputSchema: z.unknown(),
      // @ts-expect-error Binary emissions are not JSON values.
      execute: async function* () {
        yield new Uint8Array([1]);
      },
    },
  });
  configurer.registerTool('factory_date', {
    version: '1',
    // @ts-expect-error A factory cannot bypass the JSON output constraint.
    definition: () => ({
      inputSchema: z.unknown(),
      execute: () => new Date(0),
    }),
  });
  const json: OnlineAgentToolDefinition<unknown, OnlineAgentJson> = {
    inputSchema: z.unknown(),
    execute: () => ({ at: new Date(0).toISOString() }),
  };
  configurer.registerTool('explicit_conversion', {
    version: '1',
    definition: json,
  });
  expectTypeOf<Date>().not.toExtend<OnlineAgentJson>();
  expectTypeOf<bigint>().not.toExtend<OnlineAgentJson>();
  expectTypeOf<Uint8Array>().not.toExtend<OnlineAgentJson>();
}

void checkContract;
