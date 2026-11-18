/** The written thinking level is one of the AI SDK's seven `reasoning` values, never another string. */
import { expectTypeOf } from 'vitest';
import type { streamText } from 'ai';
import type { OnlineAgentScope } from '../server/online/agent/types.js';
import type { ModelRequest } from '../server/online/gateway.js';
import type { CreateConversationRequest } from '../shared/conversations.js';
import type { ReasoningLevel } from '../shared/models.js';

type SdkReasoning = NonNullable<Parameters<typeof streamText>[0]['reasoning']>;

expectTypeOf<ReasoningLevel>().toEqualTypeOf<SdkReasoning>();
expectTypeOf<
  NonNullable<OnlineAgentScope['thinking']>
>().toEqualTypeOf<ReasoningLevel>();
expectTypeOf<
  NonNullable<NonNullable<CreateConversationRequest['config']>['thinking']>
>().toEqualTypeOf<ReasoningLevel>();
expectTypeOf<
  NonNullable<ModelRequest['model']['reasoning']>
>().toEqualTypeOf<ReasoningLevel>();

// @ts-expect-error `max` is not a level.
export const scope: OnlineAgentScope = { thinking: 'max' };
export const create: CreateConversationRequest = {
  config: {
    // @ts-expect-error `off` is not a level; `none` is.
    thinking: 'off',
  },
};
