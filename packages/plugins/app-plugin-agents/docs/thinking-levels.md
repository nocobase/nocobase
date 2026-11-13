# Thinking levels of online agents

A native (online) conversation chooses how hard its model thinks before answering. The level is `default` (the provider's own setting), `off`, or a level that turns thinking on: `minimal`, `low`, `medium`, `high`, `xhigh` or `max`. The server hands it to the Vercel AI SDK's `reasoning` option, and the provider's SDK package turns it into the provider's own parameter; this plugin keeps no provider-specific mapping.

## Which levels a model takes

`agents/models` answers each chat model's levels in `capabilities.reasoning.levels`, without `default`, which every model takes. The built-in levels in `server/online/capabilities.ts` are listed by provider and exact model id, checked against each provider's documentation and the SDK's mapping (the dates and sources are in that file). They apply over any base URL; a model the list does not name takes only `default`. An administrator replaces them per chat model on the Models page: Automatic keeps the built-in levels, Not supported offers none, Custom sets the levels checked. Saving refuses an empty, unknown or `default` level and levels on a model that is not a chat model.

`max` reaches the provider only through a provider package that knows it (OpenAI today); another package ignores it with a warning, which the answer then reports.

## What the server checks

| When                                               | What                                          | Result                                                                   |
| -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| Create, configure, send with overrides             | `thinking` is not a standard level            | 400 `REASONING_LEVEL_INVALID`                                            |
| Create, configure, send with overrides             | `off` asked for a model without `off`         | 400 `REASONING_LEVEL_UNSUPPORTED`                                        |
| Configure or send switching models without a level | the saved `off` is not taken by the new model | saved as `default`                                                       |
| Execution                                          | the saved level is not taken by the model now | runs the nearest lower level, else `default`; `thinking-adjusted` notice |
| Execution                                          | the provider package warns about the level    | `thinking-warning` notice                                                |

A code scope's `thinking` is the Agent's default, and the conversation's choice comes after it. Runner conversations refuse `thinking`; they keep using `effort`.

## Cost

Choosing or switching a level adds no request: it rides on the existing configuration update. An execution with a level other than `default` reads the model services once to learn the model's levels, a read it shares with web search when that is on; `default` reads nothing more. The notices are parts of the answer that is saved anyway.
