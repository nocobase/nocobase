import { expectTypeOf } from 'vitest';
import type { Agents, AgentsConfig } from '../server/tokens.js';
import type { AgentsDeps } from '../server/testing.js';

expectTypeOf<Extract<keyof Agents, 'vectors'>>().toEqualTypeOf<never>();
expectTypeOf<
  Extract<keyof AgentsDeps, 'vectors' | 'paths'>
>().toEqualTypeOf<never>();
expectTypeOf<NonNullable<AgentsConfig['vectors']>>().toEqualTypeOf<{
  readonly store: false;
}>();
