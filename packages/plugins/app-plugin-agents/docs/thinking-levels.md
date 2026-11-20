# Thinking levels of online agents

A native (online) conversation chooses how hard its model thinks before answering. The level is one of `REASONING_LEVELS` in `shared/models.ts`, the one list NocoBase keeps, from which the `ReasoningLevel` type is derived: `provider-default` (the provider's own setting), `none` (thinking off), or a level that turns thinking on: `minimal`, `low`, `medium`, `high` or `xhigh`. These are the values the Vercel AI SDK's `reasoning` call option uses; NocoBase does not tie its type to the SDK's, and decides for itself whether to follow a level the SDK adds later. The same value is used everywhere: the chat's choices, the HTTP API and its document, the saved conversation, the level remembered per model in the browser and the SDK call. The server passes it to the SDK unchanged, and the provider's SDK package turns it into the provider's own parameter; this plugin keeps no provider-specific mapping. The chat shows the levels as Default, Off, Minimal, Low, Medium, High and Extra high; those are only labels.

## Every model offers every level

Every Online chat model offers all seven levels, in that order, whatever its provider, model id, alias or base URL. The plugin keeps no list of the levels a model takes, has no registration API for one, and the Models page has no thinking setting: a model service's `ModelInput` has no `reasoning` field, so a request that sends one is refused with 400, and a value an earlier build saved in a service's models is ignored when read.

Offering a level does not mean the provider applies it. Depending on the provider package and the model, a level is:

- sent as the provider's own parameter, as asked;
- mapped to a nearby value, with a `compatibility` warning (DeepSeek sends `medium` as `high` and `xhigh` as `max`, for example), which the chat does not show;
- left out, with an `unsupported` warning (Moonshot's `moonshot-v1` models, which do not think, for example);
- sent as it is to a provider that refuses it (an OpenAI-compatible endpoint, or a model that cannot turn thinking off), which fails that call as any refused call fails. Nothing retries it with another level;
- ignored without a warning, which the chat cannot tell.

## What the server checks

Levels are checked where they enter, once, and passed on as typed values afterwards.

| Where                                   | What                                                          | Result                                                                |
| --------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| HTTP create and configuration update    | `config.thinking` is not one of the seven                     | 400, the ordinary validation error naming the field                   |
| A code scope, when it is resolved       | `thinking` is not one of the seven                            | the conversation is refused (`thinking must be one of …`)             |
| Execution, from the saved configuration | the saved level is not one of the seven                       | refused before the SDK is called (`… Choose a thinking level again.`) |
| Model service create or update          | a model names `reasoning`                                     | 400                                                                   |
| Execution                               | the provider package reports a thinking setting `unsupported` | `thinking-warning` notice, saved with the answer                      |
| Execution                               | the provider package maps the level (`compatibility`)         | nothing shown or saved                                                |
| Execution                               | the provider refuses the request                              | the call fails as usual                                               |

The HTTP schema is `z.enum(REASONING_LEVELS).optional()`, so the API document lists the seven values; `default`, `off`, `max` and values of other types are refused, never translated. A configuration update that leaves `thinking` out keeps the conversation's level, including when it sends the conversation's scope or business variables again, which revisits the scopes: a scope the conversation already had does not replace its saved level, while a newly added scope's level applies. An explicit `provider-default` replaces the level with the provider's own setting. In the chat, a new conversation shows no level chosen until one is picked or remembered for its model, and sends none, so the Agent's default applies; choosing Default sends `provider-default`. Without a level from the conversation or a scope, `provider-default` is sent. A model switch keeps the conversation's level. A code scope's `thinking` is the Agent's default, and the conversation's choice comes after it. Runner conversations refuse `thinking`; they keep using `effort`.

The execution and the model gateway's `stream()` (`models.gateway` of `agentsToken`) take the level as a typed `ReasoningLevel` and pass it to the SDK unchanged, `none` included; the gateway uses `provider-default` without one. The gateway does not check it again or take a Runner `effort`. The saved configuration is checked once where it becomes the one that runs: a conversation an earlier preview build of this feature saved with `default`, `off` or `max` is refused before the SDK is called. It still opens, shows no level chosen, and runs again once any level is chosen; nothing translates or migrates those rows.

The `thinking-warning` notice is an ordinary `data-notice` part of the answer, shown in the conversation's language. An execution adds one for the `unsupported` warnings the SDK reports whose feature is a thinking setting: it starts with `reasoning`, a `reasoning…` setting such as `reasoningEffort`, `thinking`, `extended thinking` or `providerOptions.<provider>.thinking`, followed by a space, a dot or nothing. A tool or model id that merely contains the word, such as `provider-defined tool custom.thinking_search`, does not count, at any level, `provider-default` included. A `compatibility` warning never counts, even about a thinking setting: the provider package mapped the level to the provider's nearest one as designed, so no notice is saved for it, and when it comes with an `unsupported` one, the notice carries only the `unsupported` details. The SDK's own warning log is unchanged. Answers saved by earlier builds may carry a `thinking-adjusted` notice; it still shows, and no execution writes one any more.

## Cost

Choosing or switching a level adds no request: it rides on the existing configuration update. An execution reads nothing more for its level; the notice is a part of the answer that is saved anyway.
