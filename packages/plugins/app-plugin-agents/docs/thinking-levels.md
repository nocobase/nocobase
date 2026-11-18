# Thinking levels of online agents

A native (online) conversation chooses how hard its model thinks before answering. The level is `default` (the provider's own setting), `off`, or a level that turns thinking on: `minimal`, `low`, `medium`, `high`, `xhigh` or `max`. The server hands it to the Vercel AI SDK's `reasoning` option (`default` as `provider-default`, `off` as `none`, every other level as it is, `max` included), and the provider's SDK package turns it into the provider's own parameter; this plugin keeps no provider-specific mapping.

## Every model offers every level

Every Online chat model offers all eight levels, in that order, whatever its provider, model id, alias or base URL. The plugin keeps no list of the levels a model takes, has no registration API for one, and the Models page has no thinking setting: a model service's `ModelInput` has no `reasoning` field, so a request that sends one is refused with 400, and a value an earlier build saved in a service's models is ignored when read.

Offering a level does not mean the provider applies it. Depending on the provider package and the model, a level is:

- sent as the provider's own parameter, as asked;
- mapped to a nearby value, with a `compatibility` warning (DeepSeek sends `medium` as `high`, for example);
- left out, with an `unsupported` warning (a package that does not know `max`, for example);
- sent as it is to a provider that refuses it (an OpenAI-compatible endpoint, or a model that cannot turn thinking off), which fails that call as any refused call fails. Nothing retries it with another level;
- ignored without a warning, which the chat cannot tell.

## What the server checks

| When                                   | What                                              | Result                                           |
| -------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Create, configure, send with overrides | `thinking` is not a standard level                | 400 `REASONING_LEVEL_INVALID`                    |
| Model service create or update         | a model names `reasoning`                         | 400                                              |
| Execution                              | the provider package warns about the level it got | `thinking-warning` notice, saved with the answer |
| Execution                              | the provider refuses the request                  | the call fails as usual                          |

A model switch keeps the conversation's level. A code scope's `thinking` is the Agent's default, and the conversation's choice comes after it. Runner conversations refuse `thinking`; they keep using `effort`.

The `thinking-warning` notice is an ordinary `data-notice` part of the answer, shown in the conversation's language. Answers saved by earlier builds may carry a `thinking-adjusted` notice; it still shows, and no execution writes one any more.

## Cost

Choosing or switching a level adds no request: it rides on the existing configuration update. An execution reads nothing more for its level; the notice is a part of the answer that is saved anyway.
