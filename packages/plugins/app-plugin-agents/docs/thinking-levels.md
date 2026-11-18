# Thinking levels of online agents

A native (online) conversation chooses how hard its model thinks before answering. The level is one of the seven values of the Vercel AI SDK's `reasoning` call option (`LanguageModelV4CallOptions['reasoning']`): `provider-default` (the provider's own setting), `none` (thinking off), or a level that turns thinking on: `minimal`, `low`, `medium`, `high` or `xhigh`. The same value is used everywhere: the chat's choices, the HTTP API and its document, the saved conversation, the level remembered per model in the browser and the SDK call. The server passes it to the SDK unchanged, and the provider's SDK package turns it into the provider's own parameter; this plugin keeps no provider-specific mapping. The chat shows the levels as Default, Off, Minimal, Low, Medium, High and Extra high; those are only labels.

## Every model offers every level

Every Online chat model offers all seven levels, in that order, whatever its provider, model id, alias or base URL. The plugin keeps no list of the levels a model takes, has no registration API for one, and the Models page has no thinking setting: a model service's `ModelInput` has no `reasoning` field, so a request that sends one is refused with 400, and a value an earlier build saved in a service's models is ignored when read.

Offering a level does not mean the provider applies it. Depending on the provider package and the model, a level is:

- sent as the provider's own parameter, as asked;
- mapped to a nearby value, with a `compatibility` warning (DeepSeek sends `medium` as `high`, for example);
- left out, with an `unsupported` warning (Moonshot's `moonshot-v1` models, which do not think, for example);
- sent as it is to a provider that refuses it (an OpenAI-compatible endpoint, or a model that cannot turn thinking off), which fails that call as any refused call fails. Nothing retries it with another level;
- ignored without a warning, which the chat cannot tell.

## What the server checks

| When                                   | What                                              | Result                                           |
| -------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Create, configure, send with overrides | `thinking` is not one of the seven values         | 400 `REASONING_LEVEL_INVALID`                    |
| Send                                   | the saved level is not one of the seven values    | 400 `REASONING_LEVEL_INVALID`, nothing is sent   |
| Model service create or update         | a model names `reasoning`                         | 400                                              |
| Execution                              | the provider package warns about the level it got | `thinking-warning` notice, saved with the answer |
| Execution                              | the provider refuses the request                  | the call fails as usual                          |

Values that are not the SDK's, such as `default`, `off` or `max`, are refused, never translated. A conversation saved with one by an earlier build of this feature does not run until a level is chosen again; the chat shows it with no level checked, so choosing any level saves a valid one. A model switch keeps the conversation's level. A code scope's `thinking` is the Agent's default, and the conversation's choice comes after it. Runner conversations refuse `thinking`; they keep using `effort`.

The `thinking-warning` notice is an ordinary `data-notice` part of the answer, shown in the conversation's language. Answers saved by earlier builds may carry a `thinking-adjusted` notice; it still shows, and no execution writes one any more.

## Cost

Choosing or switching a level adds no request: it rides on the existing configuration update. An execution reads nothing more for its level; the notice is a part of the answer that is saved anyway.
